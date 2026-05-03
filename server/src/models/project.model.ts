import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection/db.connection';

export interface ProjectAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Project name cannot be empty' },
        len: { args: [1, 255], msg: 'Project name must be between 1 and 255 characters' },
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        is: { args: /^[a-z0-9-]+$/, msg: 'Slug must be lowercase alphanumeric with hyphens only' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    indexes: [{ unique: true, fields: ['slug'] }],
  },
);

export default Project;
