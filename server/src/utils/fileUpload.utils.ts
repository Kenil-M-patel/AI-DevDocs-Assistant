import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ─── Supported file types ──────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set([
  // Documents
  '.pdf',
  // Markdown
  '.md', '.mdx',
  // OpenAPI / Swagger
  '.yaml', '.yml', '.json',
  // Code
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.java', '.go', '.rs',
  '.cpp', '.cc', '.cs', '.rb',
  // Plain text
  '.txt',
]);

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
  'application/json',
  'text/yaml',
  'application/yaml',
  'application/x-yaml',
  'text/x-yaml',
  // Browsers often send these for code/text files
  'application/octet-stream',
  'text/typescript',
  'application/typescript',
  'text/javascript',
  'application/javascript',
]);

// ─── Storage: disk, sorted into subdirs by type ────────────────────────────────

const BASE_UPLOAD_DIR = 'uploads/documents';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Pick subdir based on extension
    let subDir: string;
    if (ext === '.pdf') subDir = 'pdf';
    else if (['.md', '.mdx'].includes(ext)) subDir = 'markdown';
    else if (['.yaml', '.yml', '.json'].includes(ext)) subDir = 'swagger';
    else if (['.txt'].includes(ext)) subDir = 'text';
    else subDir = 'code';

    const dir = path.join(BASE_UPLOAD_DIR, subDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitise the base name to avoid path traversal
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

// ─── File filter ───────────────────────────────────────────────────────────────

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIMETYPES.has(mime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: "${ext}". Allowed: PDF, Markdown, YAML/JSON (Swagger), code files, and .txt`,
      ),
    );
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * General document upload — accepts all supported formats.
 * Field name: "document"
 */
export const documentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

/**
 * Legacy PDF-only upload — kept for backward compatibility with old routes.
 * @deprecated Use documentUpload instead.
 */
const legacyPdfDir = 'uploads/pdf';
fs.mkdirSync(legacyPdfDir, { recursive: true });

export const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, legacyPdfDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});
