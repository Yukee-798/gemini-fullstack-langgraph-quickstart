// Utility functions for the LangGraph agent

import { HumanMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';
import type { CitationInfo, SourceInfo, GroundingChunk, GoogleAIResponse } from '../types/index.js';

/**
 * Get the research topic from the messages
 * @param messages - Array of messages
 * @returns Research topic
 */
export function getResearchTopic(messages: BaseMessage[]): string {
  if (!messages || messages.length === 0) {
    return '';
  }

  // If only one message, return its content
  if (messages.length === 1) {
    return messages[messages.length - 1]!.content as string;
  }

  // Combine multiple messages into a single string
  let researchTopic = '';
  for (const message of messages) {
    if (message instanceof HumanMessage || message._getType() === 'human') {
      researchTopic += `User: ${message.content}\n`;
    } else if (message instanceof AIMessage || message._getType() === 'ai') {
      researchTopic += `Assistant: ${message.content}\n`;
    }
  }

  return researchTopic.trim();
}

/**
 * Create a map of long URLs to short URLs with unique IDs
 * @param urlsToResolve - Array of URL objects to resolve
 * @param id - Base ID for generating short URLs
 * @returns Map of original URLs to short URLs
 */
export function resolveUrls(urlsToResolve: GroundingChunk[], id: number): Record<string, string> {
  const prefix = 'https://vertexaisearch.cloud.google.com/id/';
  const urls = urlsToResolve.map(site => site.web?.uri || '');

  // Create a dictionary that maps each unique URL to its first occurrence index
  const resolvedMap: Record<string, string> = {};
  urls.forEach((url, idx) => {
    if (url && !resolvedMap[url]) {
      resolvedMap[url] = `${prefix}${id}-${idx}`;
    }
  });

  return resolvedMap;
}

/**
 * Insert citation markers into text based on start and end indices
 * @param text - Original text
 * @param citationsList - List of citation objects
 * @returns Text with citation markers inserted
 */
export function insertCitationMarkers(text: string, citationsList: CitationInfo[]): string {
  // Sort citations by end_index in descending order
  const sortedCitations = [...citationsList].sort((a, b) => {
    if (b.endIndex !== a.endIndex) {
      return b.endIndex - a.endIndex;
    }
    return b.startIndex - a.startIndex;
  });

  let modifiedText = text;
  for (const citationInfo of sortedCitations) {
    const endIdx = citationInfo.endIndex;
    let markerToInsert = '';

    for (const segment of citationInfo.segments) {
      markerToInsert += ` [${segment.label}](${segment.shortUrl})`;
    }

    // Insert the citation marker at the original end_idx position
    modifiedText = modifiedText.slice(0, endIdx) + markerToInsert + modifiedText.slice(endIdx);
  }

  return modifiedText;
}

/**
 * Extract and format citation information from a Gemini model's response
 * @param response - Response from Gemini model
 * @param resolvedUrlsMap - Map of original URLs to resolved URLs
 * @returns List of citation objects
 */
export function getCitations(response: GoogleAIResponse, resolvedUrlsMap: Record<string, string>): CitationInfo[] {
  const citations: CitationInfo[] = [];

  // Ensure response and necessary nested structures are present
  if (!response || !response.candidates || response.candidates.length === 0) {
    return citations;
  }

  const candidate = response.candidates[0];
  if (!candidate || !candidate.groundingMetadata ||
      !candidate.groundingMetadata.groundingSupports) {
    return citations;
  }

  for (const support of candidate.groundingMetadata.groundingSupports) {
    const citation: Partial<CitationInfo> = {};

    // Ensure segment information is present
    if (!support.segment) {
      continue;
    }

    const startIndex = support.segment.startIndex ?? 0;

    // Ensure end_index is present
    if (support.segment.endIndex === null || support.segment.endIndex === undefined) {
      continue;
    }

    citation.startIndex = startIndex;
    citation.endIndex = support.segment.endIndex;
    citation.segments = [];

    if (support.groundingChunkIndices && support.groundingChunkIndices.length > 0) {
      for (const ind of support.groundingChunkIndices) {
        try {
          const chunk = candidate.groundingMetadata.groundingChuncks?.[ind];
          if (!chunk?.web?.uri) continue;

          const resolvedUrl = resolvedUrlsMap[chunk.web.uri] || null;

          if (resolvedUrl) {
            citation.segments!.push({
              label: chunk.web.title?.split('.').slice(0, -1).join('.') || chunk.web.title || 'Source',
              shortUrl: resolvedUrl,
              value: chunk.web.uri
            });
          }
        } catch (error) {
          // Skip problematic chunks
          console.error('Error processing chunk:', error);
        }
      }
    }

    if (citation.segments && citation.segments.length > 0 &&
        citation.startIndex !== undefined && citation.endIndex !== undefined) {
      citations.push(citation as CitationInfo);
    }
  }

  return citations;
}

/**
 * Format sources for display
 * @param sources - Array of source objects
 * @returns Formatted sources string
 */
export function formatSources(sources: SourceInfo[]): string {
  if (!sources || sources.length === 0) {
    return '';
  }

  const uniqueSources: SourceInfo[] = [];
  const seenUrls = new Set<string>();

  for (const source of sources) {
    if (!seenUrls.has(source.value)) {
      seenUrls.add(source.value);
      uniqueSources.push(source);
    }
  }

  return uniqueSources
    .map((source, index) => `[${index + 1}] ${source.label}: ${source.value}`)
    .join('\n');
}