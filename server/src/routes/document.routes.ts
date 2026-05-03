import { Router } from 'express';
import documentController from '../controller/document.controller';
import { documentUpload } from '../utils/fileUpload.utils';

const router = Router({ mergeParams: true }); // mergeParams exposes :projectId from parent

/**
 * Document Routes (nested under projects)
 * Base: /api/v1/projects/:projectId/documents
 *
 * POST   /                              → upload a document (multipart, field: "document")
 * GET    /                              → list all documents for a project
 * GET    /:documentId                   → get a single document status + metadata
 * DELETE /:documentId                   → delete document + remove file from disk
 * POST   /:documentId/reprocess         → re-queue a failed document
 */
router.post('/', documentUpload.single('document'), documentController.upload);
router.get('/', documentController.list);
router.get('/:documentId', documentController.getById);
router.delete('/:documentId', documentController.delete);
router.post('/:documentId/reprocess', documentController.reprocess);

export default router;
