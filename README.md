# Integral Mini RAG System

This is a simplified Retrieval-Augmented Generation (RAG) system. It allows you to store community content (posts and profiles) as embeddings in a PostgreSQL database and retrieve the most relevant content based on user prompts.

## Demo

https://youtu.be/Ne_peE5U7dg

## Features

- Embeds post content and profile bios using a deterministic mock embedding function
- Stores embeddings and relationships in PostgreSQL using Prisma ORM
- Retrieves the most relevant posts or profiles based on cosine similarity
- Filters results by network ID
- Provides both a REST API and a CLI interface

## Tech Stack

- **TypeScript**: Main programming language
- **PostgreSQL**: Database for storing content and embeddings
- **Prisma**: Type-safe ORM for database operations
- **Express**: Web framework for the REST API
- **Commander**: For building the CLI interface
- **Cosine Similarity**: For ranking relevance of content

## Project Structure

```
integral-rag/
├── src/
│   ├── db/                 # Database setup and Prisma client
│   ├── models/             # Data models and database operations
│   ├── services/           # Core business logic (embedding, similarity)
│   ├── routes/             # API endpoint handlers
│   ├── utils/              # Utility functions
│   ├── cli.ts              # Command-line interface
│   └── index.ts            # Main application entry
├── prisma/                 # Prisma schema and migrations
│   └── schema.prisma       # Database schema definition
├── data/                   # CSV data files
└── ... (configuration files)
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- TypeScript


### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/freedisch/integral-rag.git
   cd integral-rag
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your PostgreSQL database (preferably via supabase) and update `.env` file with your database credentials:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/integral_rag?
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Create the database schema:
   ```bash
   npx prisma db push
   ```

6. Add sample CSV files to the `data/` directory (see CSV Structure section below)

7. Seed the database:
   ```bash
   npx prisma db seed
   ```

### Running the Application

1. Start the server:
   ```bash
   npm run dev
   ```

2. use the CLI for interactive queries:
   ```bash
   npm run cli -- query
   ```

## API Endpoints

### POST /embed

Reads CSVs, generates embeddings, and stores everything in the database.

**Request:**
```
POST /embed
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully embedded and stored all data",
  "stats": {
    "networks": 3,
    "profiles": 3,
    "posts": 9,
    "members": 9
  }
}
```

### POST /query

Accepts a prompt and network ID, returns the 5 most relevant posts or profiles within that network.

**Request:**
```json
{
  "prompt": "How to build a community?",
  "networkId": 1
}
```

**Response:**
```json
{
  "success": true,
  "network": "Tech Community",
  "prompt": "How to build a community?",
  "results": [
    {
      "type": "post",
      "item": {
        "id": 3,
        "networkId": 1,
        "author": "Alice",
        "content": "Building a tech community requires constant engagement..."
      },
      "score": 0.87
    },
  ]
}
```


```

## CLI Usage

The CLI offers an interactive way to query the system:

1. Initialize the database:
   ```bash
   npm run cli -- init
   ```

2. Start interactive query mode:
   ```bash
   npm run cli -- query
   ```

3. Select a network ID, then enter your prompts.

## Prisma Schema

The Prisma schema defines our data model and relationships:

![image](https://github.com/user-attachments/assets/2e98edb2-ccf0-418a-951a-64f243851938)



## Troubleshooting

If you encounter issues, try the following:

### PrismaClient Not Initialized Error

If you see errors like `@prisma/client did not initialize yet. Please run "prisma generate"`:

1. Make sure your Prisma client is generated:
   ```bash
   npx prisma generate
   ```

2. Check that your `.env` file contains a valid DATABASE_URL:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/integral_rag?schema=public"
   ```

3. Ensure PostgreSQL is running and accessible with the credentials in your DATABASE_URL

