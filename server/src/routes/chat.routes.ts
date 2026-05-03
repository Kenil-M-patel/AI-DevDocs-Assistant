import { Router } from 'express';
import chatController from '../controller/chat.controller';

const router = Router();

// POST /api/v1/chat
router.post('/', chatController.ask);

export default router;
