// LangGraph agent graph definition

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { stateReducers } from './state.js';
import {
  generateQuery,
  continueToWebResearch,
  webResearch,
  reflection,
  evaluateResearch,
  finalizeAnswer,
} from './nodes.js';
import logger from '../utils/logger.js';

/**
 * Define the state annotation for LangGraph
 */
const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: stateReducers.messages,
    default: () => [],
  }),
  searchQuery: Annotation<string[]>({
    reducer: stateReducers.arrayAccumulator,
    default: () => [],
  }),
  webResearchResult: Annotation<string[]>({
    reducer: stateReducers.arrayAccumulator,
    default: () => [],
  }),
  sourcesGathered: Annotation<any[]>({
    reducer: stateReducers.arrayAccumulator,
    default: () => [],
  }),
  initialSearchQueryCount: Annotation<number>({
    reducer: stateReducers.simpleValue,
    default: () => 0,
  }),
  maxResearchLoops: Annotation<number>({
    reducer: stateReducers.simpleValue,
    default: () => 2,
  }),
  researchLoopCount: Annotation<number>({
    reducer: stateReducers.simpleValue,
    default: () => 0,
  }),
  reasoningModel: Annotation<string>({
    reducer: stateReducers.simpleValue,
    default: () => 'gemini-2.0-flash',
  }),
  queryList: Annotation<any[]>({
    reducer: stateReducers.simpleValue,
    default: () => [],
  }),
  isSufficient: Annotation<boolean>({
    reducer: stateReducers.simpleValue,
    default: () => false,
  }),
  knowledgeGap: Annotation<string>({
    reducer: stateReducers.simpleValue,
    default: () => '',
  }),
  followUpQueries: Annotation<string[]>({
    reducer: stateReducers.arrayAccumulator,
    default: () => [],
  }),
  numberOfRanQueries: Annotation<number>({
    reducer: stateReducers.simpleValue,
    default: () => 0,
  }),
});

/**
 * Create the LangGraph agent
 * @returns Compiled graph
 */
export function createGraph() {
  logger.info('Creating LangGraph agent');

  // Create the graph builder
  const builder = new StateGraph(GraphState);

  // Add nodes
  const GENERATE_QUERY = 'generateQuery';
  const WEB_RESEARCH = 'webResearch';
  const REFLECTION = 'reflection';
  const FINALIZE_ANSWER = 'finalizeAnswer';

  builder.addNode(GENERATE_QUERY, generateQuery as any);
  builder.addNode(WEB_RESEARCH, webResearch as any);
  builder.addNode(REFLECTION, reflection as any);
  builder.addNode(FINALIZE_ANSWER, finalizeAnswer as any);

  // Set the entry point
  (builder as any).setEntryPoint(GENERATE_QUERY);

  // Add edges
  // From generateQuery, conditionally continue to web research
  (builder as any).addConditionalEdges(GENERATE_QUERY, continueToWebResearch as any, {
    [WEB_RESEARCH]: WEB_RESEARCH,
  });

  // From web research, always go to reflection
  (builder as any).addEdge(WEB_RESEARCH, REFLECTION);

  // From reflection, conditionally continue or finalize
  (builder as any).addConditionalEdges(REFLECTION, evaluateResearch as any, {
    [WEB_RESEARCH]: WEB_RESEARCH,
    [FINALIZE_ANSWER]: FINALIZE_ANSWER,
  });

  // From finalize answer, end
  (builder as any).addEdge(FINALIZE_ANSWER, END);

  // Compile the graph
  const graph = builder.compile({
    checkpointer: false, // Can be configured for persistence
  });

  logger.info('LangGraph agent created successfully');

  return graph;
}

// Export the default graph instance
export const graph = createGraph();
