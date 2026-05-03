import { Request, Response } from 'express';
import projectService from '../services/project.service';
import logger from '../lib/logger';

export class ProjectController {
  /**
   * POST /api/v1/projects
   * Body: { name, description? }
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body as { name?: string; description?: string };

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, error: 'Project name is required' });
        return;
      }

      const project = await projectService.create({ name, description });
      res.status(201).json({ success: true, data: project });
    } catch (error: any) {
      logger.error(`[ProjectController] create: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/projects
   */
  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const projects = await projectService.list();
      res.status(200).json({ success: true, data: projects });
    } catch (error: any) {
      logger.error(`[ProjectController] list: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/projects/:idOrSlug
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const project = await projectService.getById(req.params.idOrSlug as string);
      res.status(200).json({ success: true, data: project });
    } catch (error: any) {
      logger.error(`[ProjectController] getById: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * PATCH /api/v1/projects/:id
   * Body: { name?, description? }
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body as { name?: string; description?: string };

      if (!name && description === undefined) {
        res.status(400).json({ success: false, error: 'Nothing to update. Provide name or description.' });
        return;
      }

      const project = await projectService.update(req.params.id as string, { name, description });
      res.status(200).json({ success: true, data: project });
    } catch (error: any) {
      logger.error(`[ProjectController] update: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  /**
   * DELETE /api/v1/projects/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await projectService.delete(req.params.id as string);
      res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error: any) {
      logger.error(`[ProjectController] delete: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  };
}

export default new ProjectController();
