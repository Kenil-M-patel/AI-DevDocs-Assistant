import { Request, Response } from 'express';
import documentService from '../services/document.service';
import logger from '../lib/logger';

export class DocumentController {
  /**
   * POST /api/v1/projects/:projectId/documents
   * multipart/form-data, field name: "document"
   */
  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const projectId = req.params.projectId as string;
      const doc = await documentService.upload({ projectId, file: req.file });

      res.status(202).json({
        success: true,
        message: 'Document uploaded and queued for processing',
        data: doc,
      });
    } catch (error: any) {
      logger.error(`[DocumentController] upload: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/projects/:projectId/documents
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const docs = await documentService.listByProject(req.params.projectId as string);
      res.status(200).json({ success: true, data: docs });
    } catch (error: any) {
      logger.error(`[DocumentController] list: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/projects/:projectId/documents/:documentId
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await documentService.getById(
        req.params.documentId as string,
        req.params.projectId as string,
      );
      res.status(200).json({ success: true, data: doc });
    } catch (error: any) {
      logger.error(`[DocumentController] getById: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * DELETE /api/v1/projects/:projectId/documents/:documentId
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await documentService.delete(
        req.params.documentId as string,
        req.params.projectId as string,
      );
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
      logger.error(`[DocumentController] delete: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * POST /api/v1/projects/:projectId/documents/:documentId/reprocess
   * Re-queues a failed document for embedding
   */
  reprocess = async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await documentService.reprocess(
        req.params.documentId as string,
        req.params.projectId as string,
      );
      res.status(202).json({
        success: true,
        message: 'Document re-queued for processing',
        data: doc,
      });
    } catch (error: any) {
      logger.error(`[DocumentController] reprocess: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };
}

export default new DocumentController();
