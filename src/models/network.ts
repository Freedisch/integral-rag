import {prisma} from '../db/prisma';
import {Network} from './types';

export async function getAllNetworks(): Promise<Network[]> {
  const networks = await prisma.network.findMany();
  return networks;
}

export async function getNetworkById(id: number): Promise<Network | null> {
  return prisma.network.findUnique({
    where: {id},
  });
}

export async function insertNetwork(network: Network): Promise<Network> {
  return prisma.network.create({
    data: {
      id: network.id,
      name: network.name,
    },
  });
}

export async function insertNetworks(networks: Network[]): Promise<void> {
  await prisma.$transaction(
    networks.map(network =>
      prisma.network.upsert({
        where: {id: network.id},
        update: {name: network.name},
        create: {id: network.id, name: network.name},
      }),
    ),
  );
}
