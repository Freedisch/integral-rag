import {Request, Response} from 'express';
import {Posts, Profile, QueryRequest, QueryResponse} from '../models/types';
import {retrieveRelevantContent} from '../services/retrieval';
import {getNetworkById} from '../models/network';
import {prisma} from '../db/prisma';

/**
 * Handler for the /query endpoint
 *
 * This route accepts a user prompt and networkId, retrieves relevant content,
 * and returns the top 5 matching posts or profiles.
 */
export async function queryHandler(req: Request, res: Response): Promise<void> {
  try {
    const {prompt, networkId} = req.body as QueryRequest;

    // Validate request
    if (!prompt || prompt.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
      return;
    }

    if (!networkId || typeof networkId !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Valid networkId is required',
      });
      return;
    }

    // Check if network exists
    const network = await getNetworkById(networkId);
    if (!network) {
      res.status(404).json({
        success: false,
        message: `Network with ID ${networkId} not found`,
      });
      return;
    }

    console.log(
      `Processing query for prompt: "${prompt}" in network: ${network.name} (${networkId})`,
    );

    // Retrieve relevant content based on the prompt
    const results = await retrieveRelevantContent(prompt, networkId, 5);

    // Format the response
    const response: QueryResponse = {
      results: results.map(result => {
        // Create a properly typed response object
        if (result.type === 'post') {
          // TypeScript should know this is a Post, but we'll be explicit
          const post = result.item as Posts;
          return {
            type: 'post',
            item: {
              id: post.id,
              networkId: post.networkId,
              author: post.author,
              content: post.content,
            },
            score: result.score,
          };
        } else {
          // This must be a profile
          const profile = result.item as Profile;
          return {
            type: 'profile',
            item: {
              id: profile.id,
              name: profile.name,
              bio: profile.bio,
            },
            score: result.score,
          };
        }
      }),
    };

    res.status(200).json({
      success: true,
      network: network.name,
      prompt,
      ...response,
    });
  } catch (error) {
    console.error('Error in query handler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: (error as Error).message,
    });
  }
}
