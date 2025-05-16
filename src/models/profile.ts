import {prisma} from '../db/prisma';
import {Profile} from './types';
import {cosineSimilarity} from '../services/similarity';

export async function getAllProfiles(): Promise<Profile[]> {
  const profiles = await prisma.profile.findMany();
  return profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    bioEmbedding: profile.bioEmbedding,
  }));
}

export async function getProfilesById(id: number): Promise<Profile | null> {
  const profile = await prisma.profile.findUnique({
    where: {id},
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    bioEmbedding: profile.bioEmbedding,
  };
}

export async function insertProfile(profile: Profile): Promise<Profile> {
  const {id, name, bio, bioEmbedding} = profile;
  const createdProfile = await prisma.profile.create({
    data: {
      id: id,
      name: name,
      bio: bio,
      bioEmbedding: bioEmbedding || [],
    },
  });

  return {
    id: createdProfile.id,
    name: createdProfile.name,
    bio: createdProfile.bio,
    bioEmbedding: createdProfile.bioEmbedding,
  };
}

export async function updateProfileEmbedding(id: number, embedding: number[]) {
  await prisma.profile.update({
    where: {id},
    data: {bioEmbedding: embedding},
  });
}

export async function getSimilarProfiles(
  queryEmbedding: number[],
  networkId: number,
  limit = 5,
): Promise<{profile: Profile; score: number}[]> {
  const membersWithProfiles = await prisma.member.findMany({
    where: {networkId},
    include: {profile: true},
  });

  const profilesWithEmbedding = membersWithProfiles
    .map(member => member.profile)
    .filter(profile => profile.bioEmbedding.length > 0);

  const profilesScores = profilesWithEmbedding.map(profile => ({
    profile: {
      id: profile.id,
      name: profile.name,
      bio: profile.bio,
      bioEmbedding: profile.bioEmbedding,
    },
    score: cosineSimilarity(queryEmbedding, profile.bioEmbedding),
  }));

  profilesScores.sort((a, b) => b.score - a.score);
  return profilesScores.slice(0, limit);
}
