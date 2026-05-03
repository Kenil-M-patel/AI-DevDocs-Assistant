import { Request, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import logger from '../lib/logger';

export class PdfController {
  constructor(private pdfService: PdfService) {}

  upload = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF file' });
      }

      const result = await this.pdfService.uploadPdf(req.file);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error(`Error in PDF upload controller: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  };
}
