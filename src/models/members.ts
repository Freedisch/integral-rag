import {prisma} from '../db/prisma';
import {Members} from './types';

export async function getAllMembers(): Promise<Members[]> {
  const members = await prisma.member.findMany();
  return members.map(member => ({
    id: member.id,
    networkId: member.networkId,
    profileId: member.profileId,
  }));
}

export async function getMembersByNetworkId(
  networkId: number,
): Promise<Members[]> {
  const members = await prisma.member.findMany({
    where: {networkId},
  });

  return members.map(member => ({
    id: member.id,
    networkId: member.networkId,
    profileId: member.profileId,
  }));
}

export async function getMembersByProfileId(
  profileId: number,
): Promise<Members[]> {
  const members = await prisma.member.findMany({
    where: {profileId},
  });

  return members.map(member => ({
    id: member.id,
    networkId: member.networkId,
    profileId: member.profileId,
  }));
}

export async function insertMember(member: Members): Promise<Members> {
  const {id, networkId, profileId} = member;

  const createdMember = await prisma.member.create({
    data: {
      id,
      networkId,
      profileId,
    },
  });

  return {
    id: createdMember.id,
    networkId: createdMember.networkId,
    profileId: createdMember.profileId,
  };
}

export async function insertMembers(members: Members[]): Promise<void> {
  await prisma.$transaction(
    members.map(member =>
      prisma.member.upsert({
        where: {id: member.id},
        update: {
          networkId: member.networkId,
          profileId: member.profileId,
        },
        create: {
          id: member.id,
          networkId: member.networkId,
          profileId: member.profileId,
        },
      }),
    ),
  );
}

export async function deleteMember(id: number): Promise<boolean> {
  try {
    await prisma.member.delete({
      where: {id},
    });
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    return false;
  }
}
