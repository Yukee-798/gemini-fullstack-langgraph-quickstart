// State definitions for the LangGraph agent

import type { BaseMessage } from '@langchain/core/messages';
import type {
  OverallState,
  ReflectionState,
  QueryGenerationState,
  WebSearchState,
  SourceInfo
} from '../types/index.js';

/**
 * Search state output
 */
export class SearchStateOutput {
  public runningSummary: string | null;

  constructor({ runningSummary = null }: { runningSummary?: string | null } = {}) {
    this.runningSummary = runningSummary; // Final report
  }
}

// State reducers for LangGraph
export const stateReducers = {
  // Messages reducer - adds messages to the list
  messages: (current: BaseMessage[] = [], update: BaseMessage | BaseMessage[] | undefined): BaseMessage[] => {
    if (!update) return current;
    if (Array.isArray(update)) {
      return [...current, ...update];
    }
    return [...current, update];
  },

  // Array accumulator reducer
  arrayAccumulator: <T>(current: T[] = [], update: T | T[] | undefined): T[] => {
    if (!update) return current;
    if (Array.isArray(update)) {
      return [...current, ...update];
    }
    return [...current, update];
  },

  // Simple value reducer
  simpleValue: <T>(current: T, update: T | undefined): T => update !== undefined ? update : current
};

// Initial state factory
export function createInitialState(): OverallState {
  return {
    messages: [],
    searchQuery: [],
    webResearchResult: [],
    sourcesGathered: [],
    initialSearchQueryCount: 0,
    maxResearchLoops: 2,
    researchLoopCount: 0,
    reasoningModel: 'gemini-2.0-flash'
  };
}

// Reflection state factory
export function createReflectionState(): ReflectionState {
  return {
    isSufficient: false,
    knowledgeGap: '',
    followUpQueries: [],
    researchLoopCount: 0,
    numberOfRanQueries: 0
  };
}

// Query generation state factory
export function createQueryGenerationState(): QueryGenerationState {
  return {
    queryList: []
  };
}

// Web search state factory
export function createWebSearchState(searchQuery: string, id: number): WebSearchState {
  return {
    searchQuery,
    id
  };
}