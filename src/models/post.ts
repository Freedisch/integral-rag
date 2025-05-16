import {prisma} from '../db/prisma';
import {Posts} from './types';

/**
 * Get all posts from the database
 */
export async function getAllPosts(): Promise<Posts[]> {
  try {
    const posts = await prisma.post.findMany();
    return posts.map(post => ({
      id: post.id,
      networkId: post.networkId,
      author: post.author,
      content: post.content,
      contentEmbedding: post.contentEmbedding,
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error(`Failed to fetch posts: ${(error as Error).message}`);
  }
}

/**
 * Get a post by ID
 */
export async function getPostById(id: number): Promise<Posts | null> {
  try {
    const post = await prisma.post.findUnique({
      where: {id},
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      networkId: post.networkId,
      author: post.author,
      content: post.content,
      contentEmbedding: post.contentEmbedding,
    };
  } catch (error) {
    console.error(`Error fetching post with ID ${id}:`, error);
    throw new Error(`Failed to fetch post: ${(error as Error).message}`);
  }
}

/**
 * Insert a single post with error handling
 */
export async function insertPost(post: Posts): Promise<Posts> {
  try {
    const {id, networkId, author, content, contentEmbedding} = post;

    const upsertedPost = await prisma.post.upsert({
      where: {id},
      update: {
        networkId,
        author,
        content,
        contentEmbedding: contentEmbedding || [],
      },
      create: {
        id,
        networkId,
        author,
        content,
        contentEmbedding: contentEmbedding || [],
      },
    });

    return {
      id: upsertedPost.id,
      networkId: upsertedPost.networkId,
      author: upsertedPost.author,
      content: upsertedPost.content,
      contentEmbedding: upsertedPost.contentEmbedding,
    };
  } catch (error) {
    console.error('Error upserting post:', error);
    throw new Error(`Failed to upsert post: ${(error as Error).message}`);
  }
}

/**
 * Insert multiple posts with batch processing and error handling
 */
export async function insertPosts(posts: Posts[]): Promise<void> {
  try {
    console.log(`Inserting/updating ${posts.length} posts...`);

    const BATCH_SIZE = 25;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);

      try {
        await prisma.$transaction(
          batch.map(post =>
            prisma.post.upsert({
              where: {id: post.id},
              update: {
                networkId: post.networkId,
                author: post.author,
                content: post.content,
                contentEmbedding: post.contentEmbedding || [],
              },
              create: {
                id: post.id,
                networkId: post.networkId,
                author: post.author,
                content: post.content,
                contentEmbedding: post.contentEmbedding || [],
              },
            }),
          ),
        );

        successCount += batch.length;
        console.log(
          `Processed posts batch ${i / BATCH_SIZE + 1}/${Math.ceil(posts.length / BATCH_SIZE)}`,
        );
      } catch (error) {
        console.error(`Error in batch ${i / BATCH_SIZE + 1}:`, error);
        errorCount += batch.length;

        console.log('Falling back to individual post processing...');
        for (const post of batch) {
          try {
            await prisma.post.upsert({
              where: {id: post.id},
              update: {
                networkId: post.networkId,
                author: post.author,
                content: post.content,
                contentEmbedding: post.contentEmbedding || [],
              },
              create: {
                id: post.id,
                networkId: post.networkId,
                author: post.author,
                content: post.content,
                contentEmbedding: post.contentEmbedding || [],
              },
            });
            successCount++;
            errorCount--;
          } catch (postError) {
            console.error(`Failed to upsert post ID ${post.id}:`, postError);
          }
        }
      }
    }

    console.log(
      `Post insertion complete: ${successCount} successful, ${errorCount} failed`,
    );
  } catch (error) {
    console.error('Error in insertPosts:', error);
    throw new Error(`Failed to insert posts: ${(error as Error).message}`);
  }
}

/**
 * Update the embedding for a post
 */
export async function updatePostEmbedding(
  id: number,
  embedding: number[],
): Promise<void> {
  try {
    await prisma.post.update({
      where: {id},
      data: {contentEmbedding: embedding},
    });
  } catch (error) {
    console.error(`Error updating embedding for post ${id}:`, error);
    throw new Error(
      `Failed to update post embedding: ${(error as Error).message}`,
    );
  }
}

/**
 * Find posts similar to a query embedding in a specific network
 */
export async function getSimilarPosts(
  queryEmbedding: number[],
  networkId: number,
  limit = 5,
): Promise<{post: Posts; score: number}[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        networkId,
        contentEmbedding: {isEmpty: false},
      },
    });

    if (posts.length === 0) {
      console.log(`No posts found in network ${networkId} with embeddings`);
      return [];
    }

    const {cosineSimilarity} = await import('../services/similarity');

    const postsWithScores = posts.map(post => ({
      post: {
        id: post.id,
        networkId: post.networkId,
        author: post.author,
        content: post.content,
        contentEmbedding: post.contentEmbedding,
      },
      score: cosineSimilarity(queryEmbedding, post.contentEmbedding),
    }));

    postsWithScores.sort((a, b) => b.score - a.score);
    return postsWithScores.slice(0, limit);
  } catch (error) {
    console.error(
      `Error getting similar posts for network ${networkId}:`,
      error,
    );
    throw new Error(`Failed to get similar posts: ${(error as Error).message}`);
  }
}
