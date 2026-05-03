import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection/db.connection';

export interface QueryLogAttributes {
  id: string;
  projectId: string;
  conversationId?: string | null;
  query: string;
  responseTimeMs?: number | null;
  tokenCount?: number | null;
  chunkCount?: number | null;       // how many chunks were retrieved
  cacheHit?: boolean;               // was this served from Redis cache?
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QueryLogCreationAttributes
  extends Optional<
    QueryLogAttributes,
    | 'id'
    | 'conversationId'
    | 'responseTimeMs'
    | 'tokenCount'
    | 'chunkCount'
    | 'cacheHit'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class QueryLog
  extends Model<QueryLogAttributes, QueryLogCreationAttributes>
  implements QueryLogAttributes
{
  public id!: string;
  public projectId!: string;
  public conversationId!: string | null;
  public query!: string;
  public responseTimeMs!: number | null;
  public tokenCount!: number | null;
  public chunkCount!: number | null;
  public cacheHit!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QueryLog.init(
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
    conversationId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    responseTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    tokenCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    chunkCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    cacheHit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'query_logs',
    timestamps: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['createdAt'] },
      { fields: ['cacheHit'] },
    ],
  },
);

export default QueryLog;
