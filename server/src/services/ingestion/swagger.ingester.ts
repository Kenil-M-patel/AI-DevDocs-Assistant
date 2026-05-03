import fs from 'fs';
import path from 'path';
// swagger-parser ships as CJS; importing the default avoids the TS namespace issue
import SwaggerParser = require('swagger-parser');
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Converts a parsed OpenAPI/Swagger spec into human-readable text chunks.
 *
 * Strategy: instead of dumping raw JSON (which LLMs struggle with), we
 * reconstruct a natural-language description for each endpoint so semantic
 * search works correctly.
 *
 * Example chunk output:
 *   "POST /users/login — Authenticates a user and returns a JWT token.
 *    Request body (application/json): { email: string, password: string }
 *    Responses: 200 OK — LoginResponse, 401 Unauthorized"
 */

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: {
    description?: string;
    content?: Record<string, { schema?: Record<string, unknown> }>;
  };
  responses?: Record<
    string,
    { description?: string; content?: Record<string, { schema?: Record<string, unknown> }> }
  >;
}

interface OpenAPISpec {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, Record<string, unknown>>;
  };
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

function schemaToString(schema: Record<string, unknown> | undefined, indent = 0): string {
  if (!schema) return '';
  const pad = '  '.repeat(indent);
  if (schema.type === 'object' && schema.properties) {
    const props = Object.entries(schema.properties as Record<string, Record<string, unknown>>)
      .map(([k, v]) => `${pad}  ${k}: ${v.type ?? 'any'}${v.description ? ` (${v.description})` : ''}`)
      .join('\n');
    return `{\n${props}\n${pad}}`;
  }
  if (schema.type === 'array' && schema.items) {
    return `Array<${schemaToString(schema.items as Record<string, unknown>, indent)}>`;
  }
  return String(schema.type ?? schema.$ref ?? 'any');
}

function operationToText(method: string, routePath: string, op: OpenAPIOperation): string {
  const lines: string[] = [];

  lines.push(`${method.toUpperCase()} ${routePath}`);
  if (op.summary) lines.push(`Summary: ${op.summary}`);
  if (op.description) lines.push(`Description: ${op.description}`);
  if (op.tags?.length) lines.push(`Tags: ${op.tags.join(', ')}`);
  if (op.operationId) lines.push(`Operation ID: ${op.operationId}`);

  // Path / Query parameters
  if (op.parameters?.length) {
    lines.push('Parameters:');
    op.parameters.forEach((p) => {
      lines.push(
        `  - ${p.name} (${p.in})${p.required ? ' [required]' : ''}: ${p.description ?? ''}`,
      );
    });
  }

  // Request body
  if (op.requestBody) {
    const content = op.requestBody.content ?? {};
    const firstContentType = Object.keys(content)[0];
    const schema = firstContentType ? content[firstContentType]?.schema : undefined;
    lines.push(`Request body (${firstContentType ?? 'unknown content-type'}):`);
    if (op.requestBody.description) lines.push(`  ${op.requestBody.description}`);
    if (schema) lines.push(`  Schema: ${schemaToString(schema as Record<string, unknown>)}`);
  }

  // Responses
  if (op.responses) {
    lines.push('Responses:');
    Object.entries(op.responses).forEach(([code, res]) => {
      lines.push(`  ${code}: ${res.description ?? ''}`);
    });
  }

  return lines.join('\n');
}

export async function ingestSwagger(
  filePath: string,
  baseMetadata: Record<string, unknown> = {},
): Promise<Document[]> {
  const ext = path.extname(filePath).toLowerCase();

  // swagger-parser TS types are incomplete; dereference exists at runtime on the default export.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (await (SwaggerParser as any).dereference(filePath)) as OpenAPISpec;

  const rawTexts: string[] = [];

  // 1. API-level description
  if (api.info) {
    const header = [
      `API: ${api.info.title ?? 'Unknown API'}`,
      `Version: ${api.info.version ?? ''}`,
      api.info.description ? `Description: ${api.info.description}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    rawTexts.push(header);
  }

  // 2. One text block per endpoint operation
  if (api.paths) {
    for (const [routePath, pathItem] of Object.entries(api.paths)) {
      for (const method of HTTP_METHODS) {
        const op = (pathItem as Record<string, OpenAPIOperation>)[method];
        if (op) {
          rawTexts.push(operationToText(method, routePath, op));
        }
      }
    }
  }

  // 3. Data model (schema) descriptions
  if (api.components?.schemas) {
    for (const [name, schema] of Object.entries(api.components.schemas)) {
      rawTexts.push(`Schema: ${name}\n${schemaToString(schema as Record<string, unknown>)}`);
    }
  }

  // 4. Combine and split if any block is too large
  const combinedText = rawTexts.join('\n\n---\n\n');
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 100,
    separators: ['\n\n---\n\n', '\n\n', '\n'],
  });

  const rawDocs = [
    new Document({
      pageContent: combinedText,
      metadata: { source: filePath, fileType: ext },
    }),
  ];

  const chunks = await splitter.splitDocuments(rawDocs);

  return chunks.map((doc, i) => ({
    ...doc,
    metadata: {
      ...baseMetadata,
      ...doc.metadata,
      chunkIndex: i,
      source: filePath,
    },
  }));
}
