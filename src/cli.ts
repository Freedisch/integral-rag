/* eslint-disable n/no-process-exit */
import {Command} from 'commander';
import * as readline from 'readline';
import {prisma} from './db/prisma';
import csvLoader from './utils/cvs_loader';
import getFakeEmbedding from './services/embedding';
import {insertNetworks, getAllNetworks} from './models/network';
import {retrieveRelevantContent} from './services/retrieval';
import {initializeDatabase} from './db/client';
import {insertMembers} from './models/members';
import {insertPost} from './models/post';
import {insertProfile} from './models/profile';
import {Posts, Profile} from './models/types';

const program = new Command();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize the CLI program
program
  .name('integral-rag-cli')
  .description('CLI for Integral RAG System')
  .version('1.0.0');

// Command to initialize the database and load data
program
  .command('init')
  .description('Initialize the database and load data from CSV files')
  .action(async () => {
    try {
      console.log('Initializing database connection...');
      await initializeDatabase();

      console.log('Loading data from CSV files...');
      const networks = await csvLoader.loadNetworks();
      const profiles = await csvLoader.loadProfiles();
      const posts = await csvLoader.loadPosts();
      const members = await csvLoader.loadMembers();

      console.log('Generating embeddings and storing data...');

      // Insert networks and members
      await insertNetworks(networks);
      await insertMembers(members);

      // Generate embeddings for profiles and insert
      const profilesWithEmbeddings = profiles.map(profile => ({
        ...profile,
        bioEmbedding: getFakeEmbedding(profile.bio),
      }));
      for (const prof of profilesWithEmbeddings) {
        await insertProfile(prof);
      }

      // Generate embeddings for posts and insert
      const postsWithEmbeddings = posts.map(post => ({
        ...post,
        contentEmbedding: getFakeEmbedding(post.content),
      }));
      for (const post of postsWithEmbeddings) {
        await insertPost(post);
      }

      console.log('Database initialized and data loaded successfully!');
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error initializing database:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  });

// Command to start the interactive query mode
program
  .command('query')
  .description('Start interactive query mode')
  .action(async () => {
    try {
      // Initialize the database
      await initializeDatabase();

      // Get available networks
      const networks = await getAllNetworks();

      if (networks.length === 0) {
        console.log('No networks found. Please run the init command first.');
        await prisma.$disconnect();
        process.exit(1);
      }

      console.log('\n=== Integral RAG System - Interactive Query Mode ===\n');
      console.log('Available networks:');

      networks.forEach(network => {
        console.log(`  ${network.id}: ${network.name}`);
      });

      // Ask for network ID
      rl.question('\nEnter network ID: ', async networkIdStr => {
        const networkId = parseInt(networkIdStr);

        if (isNaN(networkId) || !networks.some(n => n.id === networkId)) {
          console.log('Invalid network ID. Please try again.');
          rl.close();
          await prisma.$disconnect();
          process.exit(1);
        }

        const network = networks.find(n => n.id === networkId);
        console.log(`\nSelected network: ${network?.name}\n`);

        // Function for handling queries
        const promptForQuery = () => {
          rl.question(
            'Enter your query (or "exit" to quit): ',
            async prompt => {
              if (prompt.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                await prisma.$disconnect();
                process.exit(0);
              }

              try {
                // Retrieve relevant content
                const results = await retrieveRelevantContent(
                  prompt,
                  networkId,
                  5,
                );

                console.log('\n=== Results ===\n');

                if (results.length === 0) {
                  console.log('No relevant content found.');
                } else {
                  results.forEach((result, index) => {
                    console.log(
                      `#${index + 1} (${result.type}) - Similarity: ${result.score.toFixed(4)}`,
                    );

                    if (result.type === 'post') {
                      const post = result.item as Posts;
                      console.log(`Author: ${post.author}`);
                      console.log(`Content: ${post.content}`);
                    } else {
                      const profile = result.item as Profile;
                      console.log(`Name: ${profile.name}`);
                      console.log(`Bio: ${profile.bio}`);
                    }

                    console.log(''); // Empty line for readability
                  });
                }

                // Ask for another query
                promptForQuery();
              } catch (error) {
                console.error('Error processing query:', error);
                rl.close();
                await prisma.$disconnect();
                process.exit(1);
              }
            },
          );
        };

        // Start the query loop
        promptForQuery();
      });
    } catch (error) {
      console.error('Error starting interactive query mode:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  });

// Start the CLI
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
// function insertProfiles(
//   profilesWithEmbeddings: {
//     bioEmbedding: number[];
//     id: number;
//     name: string;
//     bio: string;
//   }[],
// ) {
//   throw new Error('Function not implemented.');
// }

// function insertPosts(
//   postsWithEmbeddings: {
//     contentEmbedding: number[];
//     id: number;
//     author: string;
//     networkId: number;
//     content: string;
//   }[],
// ) {
//   throw new Error('Function not implemented.');
// }
