import Joi, { ValidationResult } from 'joi';
import dotenv from 'dotenv';

dotenv.config();

interface IEnvVars {
  PORT: string;
  NODE_ENV: string;
  DEBUG: string;
  JWT_SECRET: string;
  DATABASE_HOST: string;
  DATABASE_NAME: string;
  DATABASE_NAME_TEST: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  REDIS_URL: string;

  FRONTEND_URL: string;
  BASE_URL: string;
  ALLOWED_ORIGINS: string;

  VECTOR_DB_URL: string;

  // Ollama configuration
  OLLAMA_BASE_URL: string;
  OLLAMA_EMBED_MODEL: string;
  OLLAMA_LLM_MODEL: string;
}

// Define schema for environment variables with clear types
const schema: Joi.ObjectSchema<IEnvVars> = Joi.object<IEnvVars, true, IEnvVars>({
  PORT: Joi.string().required().description('Port is required'),
  NODE_ENV: Joi.string().required().description('NODE_ENV is required'),
  DEBUG: Joi.string().required().description('DEBUG is required'),
  DATABASE_HOST: Joi.string().required().description('DATABASE_HOST is required'),
  JWT_SECRET: Joi.string().required().description('JWT_SECRET is required'),
  DATABASE_NAME: Joi.string().required().description('DATABASE_NAME is required'),
  DATABASE_NAME_TEST: Joi.string().optional().default('test_db'),
  DATABASE_USERNAME: Joi.string().required().description('DATABASE_USERNAME is required'),
  DATABASE_PASSWORD: Joi.string().required().description('DATABASE_PASSWORD is required'),
  REDIS_URL: Joi.string().required().description('REDIS_URL is required'),

  FRONTEND_URL: Joi.string().required().description('FRONTEND_URL is required'),
  BASE_URL: Joi.string().optional().default('http://localhost:5000'),
  ALLOWED_ORIGINS: Joi.string().optional().default(''),

  VECTOR_DB_URL: Joi.string().optional().default(''),

  // Ollama configuration
  OLLAMA_BASE_URL: Joi.string().optional().default('http://host.docker.internal:11434'),
  OLLAMA_EMBED_MODEL: Joi.string().optional().default('nomic-embed-text'),
  OLLAMA_LLM_MODEL: Joi.string().optional().default('phi3'),
})
  .unknown()
  .required();

// Validate environment variables with type safety
const { error, value }: ValidationResult<IEnvVars> = schema.validate(process.env);
if (error) {
  throw new Error(`[Config] Startup validation failed: ${error.message}`);
}

const config = value as IEnvVars;
export default config;
