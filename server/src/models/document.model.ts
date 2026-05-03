import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection/db.connection';

export type DocumentType = 'pdf' | 'markdown' | 'swagger' | 'code' | 'text';
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DocumentAttributes {
  id: string;
  projectId: string;
  filename: string;        // stored filename on disk
  originalName: string;    // user-facing original name
  type: DocumentType;
  status: DocumentStatus;
  chunkCount: number;
  mimeType?: string | null;
  filePath?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentCreationAttributes
  extends Optional<
    DocumentAttributes,
    | 'id'
    | 'chunkCount'
    | 'mimeType'
    | 'filePath'
    | 'errorMessage'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  public id!: string;
  public projectId!: string;
  public filename!: string;
  public originalName!: string;
  public type!: DocumentType;
  public status!: DocumentStatus;
  public chunkCount!: number;
  public mimeType!: string | null;
  public filePath!: string | null;
  public errorMessage!: string | null;
  public metadata!: Record<string, unknown> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
      onDelete: 'CASCADE',
    },
    filename: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('pdf', 'markdown', 'swagger', 'code', 'text'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'ready', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    chunkCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    filePath: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['status'] },
      { fields: ['type'] },
    ],
  },
);

export default Document;
