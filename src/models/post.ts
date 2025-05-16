import {prisma} from '../db/prisma';
import {cosineSimilarity} from '../services/similarity';
import {Posts, Profile} from './types';

export async function getAllPosts(): Promise<Posts[]> {
  const posts = await prisma.post.findMany();
  return posts.map(post => ({
    id: post.id,
    content: post.content,
    contentEmbedding: post.contentEmbedding,
    networkId: post.networkId,
    author: post.author,
  }));
}

export async function getPostById(id: number): Promise<Posts | null> {
  const post = await prisma.post.findUnique({
    where: {id},
  });
  if (!post) {
    return null;
  }
  return {
    id: post.id,
    content: post.content,
    contentEmbedding: post.contentEmbedding,
    networkId: post.networkId,
    author: post.author,
  };
}

export async function insertPost(post: Posts): Promise<Posts> {
  const {id, content, contentEmbedding, networkId, author} = post;
  const createdPost = await prisma.post.create({
    data: {
      id: id,
      author: author,
      content: content,
      contentEmbedding: contentEmbedding || [],
      networkId: networkId,
    },
  });
  return {
    id: createdPost.id,
    content: createdPost.content,
    contentEmbedding: createdPost.contentEmbedding,
    networkId: createdPost.networkId,
    author: createdPost.author,
  };
}

export async function getSimilarPosts(
  queryEmbedding: number[],
  networkId: number,
  limit = 5,
): Promise<{post: Posts; score: number}[]> {
  const posts = await prisma.post.findMany({
    where: {
      networkId,
      contentEmbedding: {isEmpty: false},
    },
  });

  const postScores = posts.map(post => ({
    post: {
      id: post.id,
      networkId: post.networkId,
      content: post.content,
      author: post.author,
      contentEmbedding: post.contentEmbedding,
    },
    score: cosineSimilarity(queryEmbedding, post.contentEmbedding),
  }));

  postScores.sort((a, b) => b.score - a.score);
  return postScores.slice(0, limit);
}
