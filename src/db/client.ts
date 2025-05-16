
import { prisma } from "./prisma";


export async function initializeDatabase(): Promise<void> {
  try{
    await prisma.$connect();
    console.log('Database connection established successfully');

  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }

}

export default prisma;
