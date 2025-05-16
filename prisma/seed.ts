import { PrismaClient } from "../generated/prisma";
import { getFakeEmbedding } from '../src/services/embedding';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

interface NetworkCsv {
  id: string;
  name: string;
}

interface ProfileCsv {
  id: string;
  name: string;
  bio: string;
}

interface PostCsv {
  id: string;
  author: string;
  networkId: string;
  content: string;
}

interface MemberCsv {
  id: string
  profileId: string
  networkId: string
}

async function loadCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data as T))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function main() {
  console.log('starting seed...')

  try {
    const pathDir = path.join(__dirname, '../data');
    const networks = await loadCsv<NetworkCsv>(path.join(pathDir, 'Networks.csv'));
    const profiles = await loadCsv<ProfileCsv>(path.join(pathDir, 'Profiles.csv'));
    const posts = await loadCsv<PostCsv>(path.join(pathDir, 'Posts.csv'));
    const members = await loadCsv<MemberCsv>(path.join(pathDir, 'Members.csv'));

    console.log(`Loaded: ${networks.length} networks, ${profiles.length} profiles, ${posts.length} posts, ${members.length} members`);

     // Insert networks
     for (const network of networks) {
      await prisma.network.upsert({
        where: { id: parseInt(network.id) },
        update: { name: network.name },
        create: {
          id: parseInt(network.id),
          name: network.name
        }
      });
    }
    console.log('Networks inserted');


    // Insert profiles with embeddings
    for (const profile of profiles) {
      const bioEmbedding = getFakeEmbedding(profile.bio);
      await prisma.profile.upsert({
        where: { id: parseInt(profile.id) },
        update: {
          name: profile.name,
          bio: profile.bio,
          bioEmbedding
        },
        create: {
          id: parseInt(profile.id),
          name: profile.name,
          bio: profile.bio,
          bioEmbedding
        }
      });
    }
    console.log('Profiles inserted');

    // Insert members
    for (const member of members) {
      await prisma.member.upsert({
        where: { id: parseInt(member.id) },
        update: {
          networkId: parseInt(member.networkId),
          profileId: parseInt(member.profileId)
        },
        create: {
          id: parseInt(member.id),
          networkId: parseInt(member.networkId),
          profileId: parseInt(member.profileId)
        }
      });
    }
    console.log('Members inserted');

    // Insert posts with embeddings
    for (const post of posts) {
      const contentEmbedding = getFakeEmbedding(post.content);
      await prisma.post.upsert({
        where: { id: parseInt(post.id) },
        update: {
          content: post.content,
          networkId: parseInt(post.networkId),
          author: post.author,
          contentEmbedding
        },
        create: {
          id: parseInt(post.id),
          content: post.content,
          networkId: parseInt(post.networkId),
          author: post.author,
          contentEmbedding
        }
      });
    }
    console.log('Posts inserted');

    console.log('Seed completed successfully');



  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
