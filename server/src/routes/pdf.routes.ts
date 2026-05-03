import { Router } from 'express';
import { PdfController } from '../controller/pdf.controller';
import { PdfService } from '../services/pdf.service';
import { pdfUpload } from '../utils/fileUpload.utils';
import { enqueuePdfForEmbedding } from '../queues/pdf.queue';

const router = Router();

// Dependency Injection: Pass the queue enqueuer to the service
const pdfService = new PdfService(enqueuePdfForEmbedding);
const pdfController = new PdfController(pdfService);

// POST /upload (Base path is /api/v1/pdf)
router.post('/upload', pdfUpload.single('pdf'), pdfController.upload);

export default router;
