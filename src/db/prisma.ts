import { PrismaClient } from '../../generated/prisma';


const globablPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
}

export const prisma = globablPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globablPrisma.prisma = prisma;
