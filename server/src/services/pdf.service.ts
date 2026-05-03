import logger from '../lib/logger';

export type EnqueuePdfFn = (fileUrl: string) => Promise<void>;

export class PdfService {
  constructor(private enqueuePdfFn?: EnqueuePdfFn) {}

  /**
   * Process the uploaded PDF file and trigger embedding queue
   * @param file The uploaded file object from multer
   * @returns Object containing file metadata and path
   */
  async uploadPdf(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    logger.info(`PDF uploaded successfully: ${file.filename}`);

    // Trigger queue event if enqueuer is provided
    if (this.enqueuePdfFn) {
      // Use the local path or a URL depending on your architecture
      // For now, we use the local path as the 'fileUrl'
      await this.enqueuePdfFn(file.path);
    }

    return {
      message: 'PDF uploaded successfully and enqueued for processing',
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
    };
  }
}
