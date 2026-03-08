import mongoose from 'mongoose';
import config from './config';

let cached: typeof mongoose | null = null;
let seedPromise: Promise<void> | null = null;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!config.mongodb.uri) return null;
  if (cached) return cached;

  try {
    cached = await mongoose.connect(config.mongodb.uri, {
      bufferCommands: false,
      dbName: 'senate',
    });
    console.log('[SENATE] MongoDB connected');

    if (!seedPromise) {
      seedPromise = import('./db-seed').then(m => m.seedDemoDataIfEmpty());
    }

    return cached;
  } catch (err) {
    console.error('[SENATE] MongoDB connection failed:', err);
    return null;
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
