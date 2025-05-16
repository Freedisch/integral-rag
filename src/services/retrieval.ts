import {getFakeEmbedding} from './embedding';
import {getSimilarPosts} from '../models/post';
import {getSimilarProfiles} from '../models/profile';
import {SimilarityResult, Profile} from '../models/types';
import {cosineSimilarity} from './similarity';

/**
 * Retrieval service for the RAG system
 *
 * This service is responsible for:
 * 1. Generating embeddings for user prompts
 * 2. Retrieving relevant content (posts or profiles) based on embedding similarity
 * 3. Combining and ranking results
 */

export async function retrieveRelevantContent(
  prompt: string,
  networkId: number,
  limit: 5,
): Promise<SimilarityResult[]> {
  const promptEmbedding = getFakeEmbedding(prompt);

  const similarPosts = await getSimilarPosts(promptEmbedding, networkId, limit);
  const similarProfiles = await getSimilarProfiles(
    promptEmbedding,
    networkId,
    limit,
  );

  const results: SimilarityResult[] = [
    ...similarPosts.map(({post, score}) => ({
      type: 'post' as const,
      item: post,
      score,
    })),
    ...similarProfiles.map(({profile, score}) => ({
      type: 'profile' as const,
      item: profile,
      score,
    })),
  ];

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
