import path from 'path';
import fs from 'fs';
import logger from '../lib/logger';
import { Document, DocumentType, DocumentStatus } from '../models/document.model';
import { Project } from '../models/project.model';
import { enqueueDocument } from '../queues/document.queue';
import { detectDocumentType } from './ingestion/index';

export interface UploadDocumentDto {
  projectId: string;
  file: Express.Multer.File;
}

export class DocumentService {
  /**
   * Called by the upload controller.
   * Creates a Document record (status=pending), enqueues it for embedding.
   */
  async upload(dto: UploadDocumentDto): Promise<Document> {
    const { projectId, file } = dto;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    // Derive document type from file extension
    const fileType: DocumentType = detectDocumentType(file.originalname);

    // Create DB record
    const doc = await Document.create({
      projectId,
      filename: file.filename,
      originalName: file.originalname,
      type: fileType,
      status: 'pending',
      mimeType: file.mimetype,
      filePath: file.path,
    });

    logger.info(
      `[DocumentService] Created doc ${doc.id} for project ${projectId} — "${file.originalname}" (${fileType})`,
    );

    // Enqueue for background processing
    await enqueueDocument({
      fileUrl: file.path,
      documentId: doc.id,
      projectId,
      fileType,
      originalName: file.originalname,
    });

    return doc;
  }

  /**
   * List all documents in a project, newest first.
   */
  async listByProject(projectId: string): Promise<Document[]> {
    const project = await Project.findByPk(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    return Document.findAll({
      where: { projectId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get a single document by id (validates it belongs to the given project).
   */
  async getById(documentId: string, projectId: string): Promise<Document> {
    const doc = await Document.findOne({
      where: { id: documentId, projectId },
    });
    if (!doc) throw new Error(`Document not found: ${documentId}`);
    return doc;
  }

  /**
   * Delete a document record and remove the physical file from disk.
   * Note: PGVector chunks are NOT deleted here — that's handled in Phase 3
   * where we'll add a cleanup job to the queue.
   */
  async delete(documentId: string, projectId: string): Promise<void> {
    const doc = await this.getById(documentId, projectId);

    // Remove file from disk
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
      logger.info(`[DocumentService] Deleted file ${doc.filePath}`);
    }

    await doc.destroy();
    logger.info(`[DocumentService] Deleted doc ${documentId}`);
  }

  /**
   * Re-trigger embedding for a document that has status 'failed'.
   */
  async reprocess(documentId: string, projectId: string): Promise<Document> {
    const doc = await this.getById(documentId, projectId);

    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      throw new Error(`Cannot reprocess: file no longer exists at ${doc.filePath}`);
    }

    // Reset status
    await Document.update({ status: 'pending', errorMessage: null, chunkCount: 0 }, { where: { id: documentId } });

    await enqueueDocument({
      fileUrl: doc.filePath,
      documentId: doc.id,
      projectId,
      fileType: doc.type,
      originalName: doc.originalName,
    });

    logger.info(`[DocumentService] Re-queued doc ${documentId} for reprocessing`);
    return doc.reload();
  }
}

export default new DocumentService();
