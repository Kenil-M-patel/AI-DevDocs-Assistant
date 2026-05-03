import { Op } from 'sequelize';
import { Project, ProjectCreationAttributes } from '../models/project.model';
import { Document } from '../models/document.model';
import logger from '../lib/logger';

/**
 * Converts a project name into a URL-safe slug.
 * e.g. "React Docs 2024" → "react-docs-2024"
 */
const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Ensures the slug is unique by appending a numeric suffix if needed.
 * e.g. "react-docs" → "react-docs-2"
 */
const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where: Record<string, unknown> = { slug };
    if (excludeId) {
      (where as any).id = { [Op.ne]: excludeId };
    }
    const existing = await Project.findOne({ where });
    if (!existing) return slug;
    slug = `${baseSlug}-${++counter}`;
  }
};

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export class ProjectService {
  /**
   * Create a new project workspace.
   */
  async create(dto: CreateProjectDto): Promise<Project> {
    const baseSlug = toSlug(dto.name);
    if (!baseSlug) {
      throw new Error('Project name produces an invalid slug. Use alphanumeric characters.');
    }

    const slug = await ensureUniqueSlug(baseSlug);

    const project = await Project.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() ?? null,
    } as ProjectCreationAttributes);

    logger.info(`[ProjectService] Created project "${project.name}" (slug: ${project.slug})`);
    return project;
  }

  /**
   * List all projects, newest first, with document counts.
   */
  async list(): Promise<Project[]> {
    const projects = await Project.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'status'],
        },
      ],
    });
    return projects;
  }

  /**
   * Get a single project by id or slug.
   */
  async getById(idOrSlug: string): Promise<Project> {
    const project = await Project.findOne({
      where: {
        [Op.or]: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: [{ model: Document, as: 'documents', attributes: ['id', 'status', 'type', 'originalName'] }],
    });

    if (!project) {
      throw new Error(`Project not found: ${idOrSlug}`);
    }
    return project;
  }

  /**
   * Update a project's name and/or description.
   */
  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await Project.findByPk(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    if (dto.name) {
      const baseSlug = toSlug(dto.name);
      if (!baseSlug) throw new Error('Project name produces an invalid slug.');
      project.name = dto.name.trim();
      project.slug = await ensureUniqueSlug(baseSlug, id);
    }

    if (dto.description !== undefined) {
      project.description = dto.description?.trim() ?? null;
    }

    await project.save();
    logger.info(`[ProjectService] Updated project "${project.name}" (${id})`);
    return project;
  }

  /**
   * Delete a project and cascade-delete its documents, conversations and query logs.
   */
  async delete(id: string): Promise<void> {
    const project = await Project.findByPk(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    await project.destroy();
    logger.info(`[ProjectService] Deleted project "${project.name}" (${id})`);
  }
}

export default new ProjectService();
