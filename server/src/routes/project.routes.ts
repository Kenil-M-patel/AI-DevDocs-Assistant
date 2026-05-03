import { Router } from 'express';
import projectController from '../controller/project.controller';

const router = Router();

/**
 * Project Workspace Routes
 * Base: /api/v1/projects
 *
 * GET    /                  → list all projects
 * POST   /                  → create a new project
 * GET    /:idOrSlug         → get a project by UUID or slug
 * PATCH  /:id               → update name/description
 * DELETE /:id               → delete project + all documents/conversations/logs
 */
router.get('/', projectController.list);
router.post('/', projectController.create);
router.get('/:idOrSlug', projectController.getById);
router.patch('/:id', projectController.update);
router.delete('/:id', projectController.delete);

export default router;
