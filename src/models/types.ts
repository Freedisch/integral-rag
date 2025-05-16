export interface Network {
  id: number;
  name: string;
}

export interface Profile {
  id: number;
  name: string;
  bio: string;
  bioEmbedding?: number[];
}

export interface Posts {
  id: number;
  author: string;
  networkId: number;
  content: string;
  contentEmbedding?: number[];
}

export interface Members {
  id: number;
  profileId: number;
  networkId: number;
}

export interface QueryRequest {
  prompt: string;
  networkId: number;
}

export interface SimilarityResult {
  type: 'post' | 'profile';
  item: Posts | Profile;
  score: number;
}

export interface QueryResponse {
  results: SimilarityResult[];
}

export interface EmbeddingFunction {
  (text: string): number[];
}
