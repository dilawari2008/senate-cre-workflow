import { connectDB } from './db';
import ProposalModel from './models/Proposal';

let checked = false;

export async function seedDemoDataIfEmpty() {
  if (checked) return;
  const db = await connectDB();
  if (!db) return;

  try {
    const count = await ProposalModel.countDocuments();
    checked = true;
    console.log(`[DB] Connected — ${count} proposals in database`);
  } catch (e) {
    console.error('[DB] Connection check failed:', e);
  }
}
