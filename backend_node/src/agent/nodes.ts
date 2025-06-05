// LangGraph agent nodes

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIMessage } from '@langchain/core/messages';
import { Configuration } from '../config/index.js';
import {
  getQueryWriterInstructions,
  getWebSearcherInstructions,
  getReflectionInstructions,
  getAnswerInstructions,
  getCurrentDate
} from './prompts.js';
import {
  getCitations,
  getResearchTopic,
  insertCitationMarkers,
  resolveUrls
} from './utils.js';
import { SearchQueryListSchema, ReflectionSchema } from './tools.js';
import logger from '../utils/logger.js';
import type {
  OverallState,
  ReflectionState,
  ConfigType,
  SendObject,
  SearchQueryListResponse,
  ReflectionResponse,
  SourceInfo
} from '../types/index.js';

// Initialize Google Generative AI client for web search
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Generate search queries based on the user's question
 * @param state - Current graph state
 * @param config - Configuration for the runnable
 * @returns State update with generated queries
 */
export async function generateQuery(
  state: OverallState,
  config?: ConfigType
): Promise<Partial<OverallState>> {
  logger.info('Generating search queries', {
    messageCount: state.messages?.length || 0
  });

  const configuration = Configuration.fromRunnableConfig(config || {});

  // Check for custom initial search query count
  if (state.initialSearchQueryCount === null || state.initialSearchQueryCount === undefined) {
    state.initialSearchQueryCount = configuration.numberOfInitialQueries;
  }

  // Get API key and ensure it's available
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  // Initialize Gemini model
  const llm = new ChatGoogleGenerativeAI({
    modelName: configuration.queryGeneratorModel,
    temperature: 1.0,
    maxRetries: 2,
    apiKey: apiKey
  });

  // Create structured output parser
  const structuredLlm = llm.withStructuredOutput(SearchQueryListSchema);

  // Format the prompt
  const currentDate = getCurrentDate();
  const formattedPrompt = getQueryWriterInstructions({
    currentDate,
    researchTopic: getResearchTopic(state.messages),
    numberQueries: state.initialSearchQueryCount
  });

  // Generate the search queries
  const result = await structuredLlm.invoke(formattedPrompt) as SearchQueryListResponse;

  logger.info('Generated queries', {
    queryCount: result.query.length,
    rationale: result.rationale
  });

  return { queryList: result.query.map(q => ({ query: q, rationale: result.rationale })) };
}

/**
 * Continue to web research - creates Send objects for parallel processing
 * @param state - Query generation state
 * @returns Array of Send objects for web research
 */
export function continueToWebResearch(state: OverallState): SendObject[] {
  return (state.queryList || []).map((searchQuery, idx) => ({
    node: 'webResearch',
    args: { searchQuery: searchQuery.query, id: idx }
  }));
}

/**
 * Perform web research using Google Search
 * @param state - Web search state
 * @param config - Configuration
 * @returns State update with research results
 */
export async function webResearch(
  state: OverallState & { searchQuery: string; id: number },
  config?: ConfigType
): Promise<Partial<OverallState>> {
  logger.info('Performing web research', {
    query: state.searchQuery,
    id: state.id
  });

  const configuration = Configuration.fromRunnableConfig(config || {});
  const formattedPrompt = getWebSearcherInstructions({
    currentDate: getCurrentDate(),
    researchTopic: state.searchQuery
  });

  try {
    // Use Google Generative AI with search grounding
    const model = genAI.getGenerativeModel({
      model: configuration.queryGeneratorModel,
      tools: [{
        googleSearchRetrieval: {}
      }]
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: formattedPrompt }] }],
      generationConfig: {
        temperature: 0
      }
    });

    const response = result.response;

    // Resolve URLs to short URLs - use correct property name
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChuncks || [];
    const resolvedUrls = resolveUrls(groundingChunks, state.id);

    // Get citations and add them to the generated text
    const citations = getCitations(response, resolvedUrls);
    const modifiedText = insertCitationMarkers(response.text(), citations);

    // Extract sources
    const sourcesGathered: SourceInfo[] = citations.flatMap(citation => citation.segments);

    logger.info('Web research completed', {
      sourcesCount: sourcesGathered.length,
      textLength: modifiedText.length
    });

    return {
      sourcesGathered,
      searchQuery: [state.searchQuery],
      webResearchResult: [modifiedText]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Web research failed', { error: errorMessage });

    // Fallback to mock data if search fails
    return {
      sourcesGathered: [],
      searchQuery: [state.searchQuery],
      webResearchResult: [`Research for "${state.searchQuery}" - No results found due to error: ${errorMessage}`]
    };
  }
}

/**
 * Reflect on research results to identify knowledge gaps
 * @param state - Overall state
 * @param config - Configuration
 * @returns Reflection state update
 */
export async function reflection(
  state: OverallState,
  config?: ConfigType
): Promise<Partial<OverallState & ReflectionState>> {
  logger.info('Reflecting on research results', {
    resultsCount: state.webResearchResult?.length || 0
  });

  const configuration = Configuration.fromRunnableConfig(config || {});

  // Increment research loop count
  const researchLoopCount = (state.researchLoopCount || 0) + 1;
  const reasoningModel = state.reasoningModel || configuration.reflectionModel;

  // Format the prompt
  const formattedPrompt = getReflectionInstructions({
    researchTopic: getResearchTopic(state.messages),
    summaries: state.webResearchResult.join('\n\n---\n\n')
  });

  // Get API key and ensure it's available
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  // Initialize reasoning model
  const llm = new ChatGoogleGenerativeAI({
    modelName: reasoningModel,
    temperature: 1.0,
    maxRetries: 2,
    apiKey: apiKey
  });

  const result = await llm.withStructuredOutput(ReflectionSchema).invoke(formattedPrompt) as ReflectionResponse;

  logger.info('Reflection completed', {
    isSufficient: result.isSufficient,
    knowledgeGap: result.knowledgeGap,
    followUpQueriesCount: result.followUpQueries?.length || 0
  });

  return {
    isSufficient: result.isSufficient,
    knowledgeGap: result.knowledgeGap,
    followUpQueries: result.followUpQueries || [],
    researchLoopCount: researchLoopCount,
    numberOfRanQueries: state.searchQuery?.length || 0
  };
}

/**
 * Evaluate research and determine next step
 * @param state - Reflection state
 * @param config - Configuration
 * @returns Next node(s) to execute
 */
export function evaluateResearch(
  state: OverallState & ReflectionState,
  config?: ConfigType
): string | SendObject[] {
  const configuration = Configuration.fromRunnableConfig(config || {});
  const maxResearchLoops = state.maxResearchLoops ?? configuration.maxResearchLoops;

  logger.info('Evaluating research', {
    isSufficient: state.isSufficient,
    researchLoopCount: state.researchLoopCount,
    maxResearchLoops
  });

  if (state.isSufficient || state.researchLoopCount >= maxResearchLoops) {
    return 'finalizeAnswer';
  } else {
    // Return Send objects for follow-up queries
    return (state.followUpQueries || []).map((followUpQuery, idx) => ({
      node: 'webResearch',
      args: {
        searchQuery: followUpQuery,
        id: state.numberOfRanQueries + idx
      }
    }));
  }
}

/**
 * Finalize the answer based on all research
 * @param state - Overall state
 * @param config - Configuration
 * @returns Final state with answer
 */
export async function finalizeAnswer(
  state: OverallState,
  config?: ConfigType
): Promise<Partial<OverallState>> {
  logger.info('Finalizing answer', {
    summariesCount: state.webResearchResult?.length || 0,
    sourcesCount: state.sourcesGathered?.length || 0
  });

  const configuration = Configuration.fromRunnableConfig(config || {});
  const reasoningModel = state.reasoningModel || configuration.answerModel;

  // Format the prompt
  const currentDate = getCurrentDate();
  const formattedPrompt = getAnswerInstructions({
    currentDate,
    researchTopic: getResearchTopic(state.messages),
    summaries: state.webResearchResult.join('\n---\n\n')
  });

  // Get API key and ensure it's available
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  // Initialize reasoning model
  const llm = new ChatGoogleGenerativeAI({
    modelName: reasoningModel,
    temperature: 0,
    maxRetries: 2,
    apiKey: apiKey
  });

  const result = await llm.invoke(formattedPrompt);

  // Replace short URLs with original URLs and collect unique sources
  let finalContent = result.content as string;
  const uniqueSources: SourceInfo[] = [];
  const seenUrls = new Set<string>();

  for (const source of state.sourcesGathered) {
    if (source.shortUrl && finalContent.includes(source.shortUrl)) {
      finalContent = finalContent.replace(
        new RegExp(source.shortUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        source.value
      );
      if (!seenUrls.has(source.value)) {
        seenUrls.add(source.value);
        uniqueSources.push(source);
      }
    }
  }

  logger.info('Answer finalized', {
    answerLength: finalContent.length,
    uniqueSourcesCount: uniqueSources.length
  });

  return {
    messages: [new AIMessage(finalContent)],
    sourcesGathered: uniqueSources
  };
}