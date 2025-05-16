/**
 * Handler for the embed/ endpoint
 *
 * This route loads all data from CSV files, generates embeddings and stores everything in the database
 */

import {insertMembers} from '../models/members';
import {insertNetworks} from '../models/network';
import {insertPost} from '../models/post';
import {insertProfile} from '../models/profile';
import getFakeEmbedding from '../services/embedding';
import CsvLoader from '../utils/cvs_loader';
import {Request, Response} from 'express';

export async function embedHandler(req: Request, res: Response): Promise<void> {
  try {
    console.log('starting data embedding process...');

    const networks = await CsvLoader.loadNetworks();
    const profiles = await CsvLoader.loadProfiles();
    const posts = await CsvLoader.loadPosts();
    const members = await CsvLoader.loadMembers();

    console.log(
      `Loaded data: ${networks.length} networks, ${profiles.length} profiles, ${posts.length} posts, ${members.length} members`,
    );

    await insertNetworks(networks);

    const profilesWithEmbedding = profiles.map(profile => ({
      ...profile,
      bioEmbedding: getFakeEmbedding(profile.bio),
    }));
    for (const prof of profilesWithEmbedding) {
      await insertProfile(prof);
    }
    await insertMembers(members);
    const postsWithEmbeddings = posts.map(post => ({
      ...post,
      contentEmbedding: getFakeEmbedding(post.content),
    }));
    for (const post of postsWithEmbeddings) {
      await insertPost(post);
    }

    console.log('Finished embedding and storing all data');

    res.status(200).json({
      success: true,
      message: 'Successfully embedded and stored all data',
      stats: {
        networks: networks.length,
        profiles: profiles.length,
        posts: posts.length,
        members: members.length,
      },
    });
  } catch (error) {
    console.error('Error in embed handler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to embed and store data',
      error: (error as Error).message,
    });
  }
}
