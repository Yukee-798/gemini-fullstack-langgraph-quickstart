import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { ConfigType } from '../types/index.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Configuration class
export class Configuration {
  public readonly queryGeneratorModel: string;
  public readonly reflectionModel: string;
  public readonly answerModel: string;
  public readonly numberOfInitialQueries: number;
  public readonly maxResearchLoops: number;
  public readonly port: number;
  public readonly nodeEnv: string;
  public readonly googleApiKey: string;
  public readonly langgraphApiUrl: string;
  public readonly logLevel: string;
  public readonly corsOrigin: string;

  constructor(config: ConfigType = {}) {
    const configurable = config?.configurable || {};

    // Agent configuration with defaults
    this.queryGeneratorModel = process.env.QUERY_GENERATOR_MODEL ||
      configurable.query_generator_model ||
      'gemini-2.0-flash';

    this.reflectionModel = process.env.REFLECTION_MODEL ||
      configurable.reflection_model ||
      'gemini-2.5-flash-preview-04-17';

    this.answerModel = process.env.ANSWER_MODEL ||
      configurable.answer_model ||
      'gemini-2.5-pro-preview-05-06';

    this.numberOfInitialQueries = parseInt(
      process.env.NUMBER_OF_INITIAL_QUERIES ||
      configurable.number_of_initial_queries ||
      '3'
    );

    this.maxResearchLoops = parseInt(
      process.env.MAX_RESEARCH_LOOPS ||
      configurable.max_research_loops ||
      '2'
    );

    // Server configuration
    this.port = parseInt(process.env.PORT || '8000');
    this.nodeEnv = process.env.NODE_ENV || 'development';

    // API Keys
    this.googleApiKey = process.env.GOOGLE_API_KEY || '';
    if (!this.googleApiKey) {
      throw new Error('GOOGLE_API_KEY is required in environment variables');
    }

    // LangGraph configuration
    this.langgraphApiUrl = process.env.LANGGRAPH_API_URL || 'http://localhost:8123';

    // Logging
    this.logLevel = process.env.LOG_LEVEL || 'info';

    // CORS
    this.corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  }

  static fromRunnableConfig(config: ConfigType): Configuration {
    return new Configuration(config);
  }

  toJSON(): Record<string, any> {
    return {
      queryGeneratorModel: this.queryGeneratorModel,
      reflectionModel: this.reflectionModel,
      answerModel: this.answerModel,
      numberOfInitialQueries: this.numberOfInitialQueries,
      maxResearchLoops: this.maxResearchLoops,
      port: this.port,
      nodeEnv: this.nodeEnv,
      langgraphApiUrl: this.langgraphApiUrl,
      logLevel: this.logLevel,
      corsOrigin: this.corsOrigin
    };
  }
}

// Export default configuration instance
export default new Configuration();