/**
 * Central model registry.
 * Import this once (in db.connection.ts) to register all models and associations.
 */
import { Project } from './project.model';
import { Document } from './document.model';
import { Conversation } from './conversation.model';
import { QueryLog } from './query_log.model';

// ─── Associations ──────────────────────────────────────────────────────────────

// Project → Documents (1:N)
Project.hasMany(Document, {
  foreignKey: 'projectId',
  as: 'documents',
  onDelete: 'CASCADE',
});
Document.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project → Conversations (1:N)
Project.hasMany(Conversation, {
  foreignKey: 'projectId',
  as: 'conversations',
  onDelete: 'CASCADE',
});
Conversation.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project → QueryLogs (1:N)
Project.hasMany(QueryLog, {
  foreignKey: 'projectId',
  as: 'queryLogs',
  onDelete: 'CASCADE',
});
QueryLog.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

export { Project, Document, Conversation, QueryLog };
