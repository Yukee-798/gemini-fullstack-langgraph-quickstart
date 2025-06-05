// Core types for the LangGraph agent

import type { BaseMessage } from '@langchain/core/messages';

/**
 * Overall state of the agent
 */
export interface OverallState {
  messages: BaseMessage[];
  searchQuery: string[];
  webResearchResult: string[];
  sourcesGathered: SourceInfo[];
  initialSearchQueryCount: number;
  maxResearchLoops: number;
  researchLoopCount: number;
  reasoningModel: string;
  queryList?: Query[];
  isSufficient?: boolean;
  knowledgeGap?: string;
  followUpQueries?: string[];
  numberOfRanQueries?: number;
}

/**
 * Reflection state
 */
export interface ReflectionState {
  isSufficient: boolean;
  knowledgeGap: string;
  followUpQueries: string[];
  researchLoopCount: number;
  numberOfRanQueries: number;
}

/**
 * Query object
 */
export interface Query {
  query: string;
  rationale: string;
}

/**
 * Query generation state
 */
export interface QueryGenerationState {
  queryList: Query[];
}

/**
 * Web search state
 */
export interface WebSearchState {
  searchQuery: string;
  id: number;
}

/**
 * Source information
 */
export interface SourceInfo {
  label: string;
  shortUrl: string;
  value: string;
}

/**
 * Citation information
 */
export interface CitationInfo {
  startIndex: number;
  endIndex: number;
  segments: SourceInfo[];
}

/**
 * Search query list schema response
 */
export interface SearchQueryListResponse {
  query: string[];
  rationale: string;
}

/**
 * Reflection schema response
 */
export interface ReflectionResponse {
  isSufficient: boolean;
  knowledgeGap: string;
  followUpQueries: string[];
}

/**
 * Agent invoke request
 */
export interface AgentInvokeRequest {
  input: string;
  config?: {
    configurable?: {
      thread_id?: string;
      query_generator_model?: string;
      reflection_model?: string;
      answer_model?: string;
      number_of_initial_queries?: string;
      max_research_loops?: string;
    };
  };
}

/**
 * Agent invoke response
 */
export interface AgentInvokeResponse {
  output: string;
  sources: SourceInfo[];
  metadata: {
    messageCount: number;
    researchLoopCount: number;
    searchQueries: string[];
  };
}

/**
 * Configuration type
 */
export interface ConfigType {
  configurable?: {
    thread_id?: string;
    query_generator_model?: string;
    reflection_model?: string;
    answer_model?: string;
    number_of_initial_queries?: string;
    max_research_loops?: string;
  };
}

/**
 * Grounding chunk from Google AI - updated to match actual API
 */
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

/**
 * Google AI response interface - updated to match actual API
 */
export interface GoogleAIResponse {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChuncks?: GroundingChunk[];
      groundingSupports?: Array<{
        segment?: {
          startIndex?: number;
          endIndex?: number;
        };
        groundingChunkIndices?: number[];
      }>;
    };
  }>;
  text(): string;
}

/**
 * Send object for parallel processing
 */
export interface SendObject {
  node: string;
  args: Record<string, any>;
}