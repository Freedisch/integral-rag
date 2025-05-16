import * as dotenv  from 'dotenv';
import { initializeDatabase } from './db/client';
import { prisma } from './db/prisma';

// Load environment variables
dotenv.config();

// Create Express application
//const app = express();
const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());

// // Routes
// app.post('/embed', embedHandler);
// app.post('/query', queryHandler);

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'ok' });
// });

// Initialize the server
async function startServer() {
  try {
    // Initialize the database connection
    await initializeDatabase();
    console.log('Database connection established successfully');
    
    // Start the server
    // app.listen(PORT, () => {
    //   console.log(`Server is running on port ${PORT}`);
    //   console.log('Available endpoints:');
    //   console.log('  POST /embed - Load and embed data from CSV files');
    //   console.log('  POST /query - Query for relevant content based on a prompt');
    //   console.log('  GET /health - Health check endpoint');
    // });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Clean up Prisma connection on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export for testing
export { startServer };
