import * as dotenv from 'dotenv';
import { EmbeddingFunction } from '../models/types';

dotenv.config();

const EmbedDimensions = parseInt(process.env.EMEDDING_DIMENSIONS || '384');

export const getFakeEmbedding: EmbeddingFunction = (text: string): number[] => {
  const embedding = new Array(EmbedDimensions).fill(0);
  const normalizedText = text.toLowerCase().trim();

  for (let i = 0; i < normalizedText.length; i++) {
    const charCode = normalizedText.charCodeAt(i)
    const position = i % EmbedDimensions;

    embedding[position] += Math.sin(charCode * 0.1) *0.5;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / (magnitude || 1));
}

export default getFakeEmbedding;
