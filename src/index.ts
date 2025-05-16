/* eslint-disable n/no-process-exit */
import * as dotenv from 'dotenv';
import * as express from 'express';

import {Request, Response} from 'express';

import {initializeDatabase} from './db/client';
import {embedHandler} from './routes/embed';
import {queryHandler} from './routes/query';
import {prisma} from './db/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/embed', embedHandler);
app.post('/query', queryHandler);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({status: 'ok'});
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database connection established successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log('  POST /embed - Load and embed data from CSV files');
      console.log(
        '  POST /query - Query for relevant content based on a prompt',
      );
      console.log('  GET /health - Health check endpoint');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void startServer();
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export {app, startServer};
