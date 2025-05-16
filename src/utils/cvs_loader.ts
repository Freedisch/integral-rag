import * as fs from 'fs';
import { Network, Profile,Posts, Members } from '../models/types';
import * as path from 'path';
import * as csv from 'csv-parser';


export class CsvLoader {
  private pathDir: string;

  constructor(pathDir: string = path.join(process.cwd(), 'data')) {
    this.pathDir = pathDir
  }
  private async loadCsv<T>(filePath: string, transform: (row: any) => T): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.push(transform(row));
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  async loadNetworks(): Promise<Network[]> {
    return this.loadCsv<Network>(path.join(this.pathDir, 'Networks.csv'), row => ({
      id: parseInt(row.id),
      name: row.name
    }));
  }

  async loadProfiles(): Promise<Profile[]> {
    return this.loadCsv<Profile>(path.join(this.pathDir, 'Profiles.csv'), row => ({
      id: parseInt(row.id),
      name: row.name,
      bio: row.bio,
    }))
  }

  async loadPosts(): Promise<Posts[]> {
    return this.loadCsv<Posts>(path.join(this.pathDir, 'Posts.csv'), row => ({
      id: parseInt(row.id),
      networkId: parseInt(row.networkId),
      author: row.author,
      content: row.content,
    }));
  }

  async loadMembers(): Promise<Members[]> {
    return this.loadCsv<Members>(path.join(this.pathDir, 'Members.csv'), row => ({
      id: parseInt(row.id),
      profileId: parseInt(row.profileId),
      networkId: parseInt(row.networkId),
    }))
  }
}
