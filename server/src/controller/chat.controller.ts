import { Request, Response } from 'express';
import chatService from '../services/chat.service';
import logger from '../lib/logger';

export class ChatController {
  async ask(req: Request, res: Response) {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await chatService.chat(message);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error(`Error in ChatController: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }
}

export default new ChatController();
