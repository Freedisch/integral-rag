import {prisma} from '../db/prisma';
import {cosineSimilarity} from '../services/similarity';
import {Profile} from './types';

/**
 * Get all profiles from the database
 */
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const profiles = await prisma.profile.findMany();
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      bio: profile.bio,
      bioEmbedding: profile.bioEmbedding,
    }));
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw new Error(`Failed to fetch profiles: ${(error as Error).message}`);
  }
}

/**
 * Get a profile by ID
 */
export async function getProfileById(id: number): Promise<Profile | null> {
  try {
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
  } catch (error) {
    console.error(`Error fetching profile with ID ${id}:`, error);
    throw new Error(`Failed to fetch profile: ${(error as Error).message}`);
  }
}

/**
 * Insert a single profile with upsert logic to avoid duplicates
 */
export async function insertProfile(profile: Profile): Promise<Profile> {
  try {
    const {id, name, bio, bioEmbedding} = profile;

    const upsertedProfile = await prisma.profile.upsert({
      where: {id},
      update: {
        name,
        bio,
        bioEmbedding: bioEmbedding || [],
      },
      create: {
        id,
        name,
        bio,
        bioEmbedding: bioEmbedding || [],
      },
    });

    return {
      id: upsertedProfile.id,
      name: upsertedProfile.name,
      bio: upsertedProfile.bio,
      bioEmbedding: upsertedProfile.bioEmbedding,
    };
  } catch (error) {
    console.error(`Error upserting profile:`, error);
    throw new Error(`Failed to upsert profile: ${(error as Error).message}`);
  }
}

/**
 * Insert multiple profiles with error handling for duplicates
 */
export async function insertProfiles(profiles: Profile[]): Promise<void> {
  try {
    console.log(`Inserting/updating ${profiles.length} profiles...`);

    const BATCH_SIZE = 25;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);

      try {
        await prisma.$transaction(
          batch.map(profile =>
            prisma.profile.upsert({
              where: {id: profile.id},
              update: {
                name: profile.name,
                bio: profile.bio,
                bioEmbedding: profile.bioEmbedding || [],
              },
              create: {
                id: profile.id,
                name: profile.name,
                bio: profile.bio,
                bioEmbedding: profile.bioEmbedding || [],
              },
            }),
          ),
        );

        successCount += batch.length;
        console.log(
          `Processed profiles batch ${i / BATCH_SIZE + 1}/${Math.ceil(profiles.length / BATCH_SIZE)}`,
        );
      } catch (error) {
        console.error(`Error in batch ${i / BATCH_SIZE + 1}:`, error);
        errorCount += batch.length;

        console.log('Falling back to individual profile processing...');
        for (const profile of batch) {
          try {
            await prisma.profile.upsert({
              where: {id: profile.id},
              update: {
                name: profile.name,
                bio: profile.bio,
                bioEmbedding: profile.bioEmbedding || [],
              },
              create: {
                id: profile.id,
                name: profile.name,
                bio: profile.bio,
                bioEmbedding: profile.bioEmbedding || [],
              },
            });
            successCount++;
            errorCount--;
          } catch (profileError) {
            console.error(
              `Failed to upsert profile ID ${profile.id}:`,
              profileError,
            );
          }
        }
      }
    }

    console.log(
      `Profile insertion complete: ${successCount} successful, ${errorCount} failed`,
    );
  } catch (error) {
    console.error('Error in insertProfiles:', error);
    throw new Error(`Failed to insert profiles: ${(error as Error).message}`);
  }
}

/**
 * Update the embedding for a profile
 */
export async function updateProfileEmbedding(
  id: number,
  embedding: number[],
): Promise<void> {
  try {
    await prisma.profile.update({
      where: {id},
      data: {bioEmbedding: embedding},
    });
  } catch (error) {
    console.error(`Error updating embedding for profile ${id}:`, error);
    throw new Error(
      `Failed to update profile embedding: ${(error as Error).message}`,
    );
  }
}

/**
 * Find profiles similar to query embedding in a specific network
 */
export async function getSimilarProfiles(
  queryEmbedding: number[],
  networkId: number,
  limit = 5,
): Promise<{profile: Profile; score: number}[]> {
  try {
    const membersWithProfiles = await prisma.member.findMany({
      where: {networkId},
      include: {profile: true},
    });

    const profilesWithEmbeddings = membersWithProfiles
      .map(member => member.profile)
      .filter(profile => profile.bioEmbedding.length > 0);

    const profilesWithScores = profilesWithEmbeddings.map(profile => ({
      profile: {
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        bioEmbedding: profile.bioEmbedding,
      },
      score: cosineSimilarity(queryEmbedding, profile.bioEmbedding),
    }));

    profilesWithScores.sort((a, b) => b.score - a.score);
    return profilesWithScores.slice(0, limit);
  } catch (error) {
    console.error(
      `Error getting similar profiles for network ${networkId}:`,
      error,
    );
    throw new Error(
      `Failed to get similar profiles: ${(error as Error).message}`,
    );
  }
}
