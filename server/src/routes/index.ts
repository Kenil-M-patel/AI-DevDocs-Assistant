import { Router } from 'express';
import pdfRoutes from './pdf.routes';
import chatRoutes from './chat.routes';
import projectRoutes from './project.routes';
import documentRoutes from './document.routes';

const router = Router();

// Aggregate all routes under /v1
router.use('/pdf', pdfRoutes);                                          // legacy
router.use('/chat', chatRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/documents', documentRoutes);           // nested

export default router;
