// API routes for the LangGraph agent

import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { HumanMessage } from '@langchain/core/messages';
import { graph } from '../agent/graph.js';
import logger from '../utils/logger.js';
import type { AgentInvokeRequest, AgentInvokeResponse, OverallState } from '../types/index.js';

const router: Router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'langgraph-agent',
    timestamp: new Date().toISOString()
  });
});

/**
 * Agent invoke endpoint
 * POST /agent/invoke
 * Body: {
 *   input: string,
 *   config?: {
 *     configurable?: {
 *       thread_id?: string,
 *       ...other config options
 *     }
 *   }
 * }
 */
router.post('/agent/invoke', async (req: Request<{}, AgentInvokeResponse, AgentInvokeRequest>, res: Response<AgentInvokeResponse>) => {
  try {
    const { input, config = {} } = req.body;

    if (!input) {
      res.status(400).json({
        error: 'Input is required'
      } as any);
      return;
    }

    logger.info('Agent invoke request', {
      inputLength: input.length,
      threadId: config?.configurable?.thread_id
    });

    // Create initial state with user message
    const initialState = {
      messages: [new HumanMessage(input)]
    };

    // Invoke the graph
    const result = await graph.invoke(initialState as any, config as any);

    // Extract the final message and sources
    const finalMessage = result.messages?.[result.messages.length - 1];
    const sources = result.sourcesGathered || [];

    logger.info('Agent invoke completed', {
      messageCount: result.messages?.length || 0,
      sourcesCount: Array.isArray(sources) ? sources.length : 0
    });

    res.json({
      output: finalMessage?.content as string || '',
      sources: Array.isArray(sources) ? sources : [],
      metadata: {
        messageCount: result.messages?.length || 0,
        researchLoopCount: result.researchLoopCount || 0,
        searchQueries: result.searchQuery || []
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Agent invoke error', { error: errorMessage, stack: errorStack });
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    } as any);
  }
});

/**
 * Agent stream endpoint (for streaming responses)
 * POST /agent/stream
 */
router.post('/agent/stream', async (req: Request<{}, any, AgentInvokeRequest>, res: Response) => {
  try {
    const { input, config = {} } = req.body;

    if (!input) {
      res.status(400).json({
        error: 'Input is required'
      });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logger.info('Agent stream request', {
      inputLength: input.length,
      threadId: config?.configurable?.thread_id
    });

    // Create initial state
    const initialState = {
      messages: [new HumanMessage(input)]
    };

    // Stream the graph execution
    const stream = await graph.stream(initialState as any, config as any);

    for await (const chunk of stream) {
      // Send each chunk as SSE
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // Send completion event
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Agent stream error', { error: errorMessage });
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

/**
 * Get agent configuration
 */
router.get('/agent/config', (req: Request, res: Response) => {
  res.json({
    models: {
      queryGenerator: process.env.QUERY_GENERATOR_MODEL || 'gemini-2.0-flash',
      reflection: process.env.REFLECTION_MODEL || 'gemini-2.5-flash-preview-04-17',
      answer: process.env.ANSWER_MODEL || 'gemini-2.5-pro-preview-05-06'
    },
    limits: {
      numberOfInitialQueries: parseInt(process.env.NUMBER_OF_INITIAL_QUERIES || '3'),
      maxResearchLoops: parseInt(process.env.MAX_RESEARCH_LOOPS || '2')
    }
  });
});

export default router;