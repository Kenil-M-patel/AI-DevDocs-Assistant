import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection/db.connection';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    documentId: string;
    filename: string;
    chunkIndex: number;
    excerpt: string;
  }>;
  timestamp: string; // ISO string
}

export interface ConversationAttributes {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationCreationAttributes
  extends Optional<ConversationAttributes, 'id' | 'messages' | 'createdAt' | 'updatedAt'> {}

export class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  public id!: string;
  public projectId!: string;
  public title!: string;
  public messages!: ChatMessage[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init(
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: 'New Conversation',
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    indexes: [{ fields: ['projectId'] }],
  },
);

export default Conversation;
