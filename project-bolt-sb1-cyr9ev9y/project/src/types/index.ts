export type QueryType = 'sql' | 'general' | 'web';
export type ModelType = 'cohere' | 'qwen';

export interface Query {
  id: string;
  text: string;
  type: QueryType;
  model: string;
  timestamp: Date;
}

export interface WebResult {
  title: string;
  link: string;
  snippet: string;
}

export interface SQLResult {
  sql: string;
  rows: any[][];
}

export interface APIResponse {
  mode: 'sql' | 'advice' | 'search';
  data: string | WebResult[] | SQLResult;
}

export interface QueryResult {
  id: string;
  queryId: string;
  content: string | WebResult[] | SQLResult;
}

// Model-specific constants and types
export const MODEL_NAMES = {
  cohere: 'CohereLabs/c4ai-command-a-03-2025',
  qwen: 'Qwen/Qwen2.5-VL-7B-Instruct'
} as const;