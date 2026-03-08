#!/usr/bin/env tsx
/**
 * Capture Tenderly URLs from simulations for hackathon submission
 * 
 * Usage:
 *   npm run dev (in another terminal)
 *   npx tsx scripts/capture-tenderly-links.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TenderlyLink {
  proposalId: string;
  proposalTitle: string;
  simulationUrl: string;
  forkId: string;
  timestamp: string;
  verdict?: string;
  riskScore?: number;
}

const LINKS_FILE = join(process.cwd(), 'TENDERLY_LINKS.json');

// Read from MongoDB or in-memory store
async function fetchSimulations(): Promise<TenderlyLink[]> {
  const links: TenderlyLink[] = [];

  // Option 1: Read from MongoDB if available
  if (process.env.MONGODB_URI) {
    try {
      const mongoose = await import('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      
      const Simulation = mongoose.model('Simulation');
      const sims = await Simulation.find().sort({ createdAt: -1 }).limit(10);

      for (const sim of sims) {
        if (sim.simulation?.forkUrl) {
          links.push({
            proposalId: sim.proposalId,
            proposalTitle: sim.proposal?.title || 'Unknown',
            simulationUrl: sim.simulation.forkUrl,
            forkId: sim.simulation.forkId,
            timestamp: sim.createdAt.toISOString(),
            verdict: sim.verdict?.summary,
            riskScore: sim.verdict?.riskScore,
          });
        }
      }

      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB fetch failed:', err);
    }
  }

  // Option 2: Read from API endpoint
  if (links.length === 0) {
    try {
      const response = await fetch('http://localhost:3000/api/proposals');
      const proposals = await response.json();

      for (const proposal of proposals) {
        if (proposal.simulation?.forkUrl) {
          links.push({
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            simulationUrl: proposal.simulation.forkUrl,
            forkId: proposal.simulation.forkId,
            timestamp: proposal.createdAt || new Date().toISOString(),
            verdict: proposal.verdict?.summary,
            riskScore: proposal.verdict?.riskScore,
          });
        }
      }
    } catch (err) {
      console.error('API fetch failed:', err);
    }
  }

  return links;
}

// Generate markdown for README
function generateMarkdown(links: TenderlyLink[]): string {
  if (links.length === 0) {
    return '<!-- No Tenderly simulations found. Run some proposals first! -->';
  }

  let md = '## Tenderly Virtual TestNet Simulations\n\n';
  md += 'Below are live simulations demonstrating the CRE workflow with Tenderly VTN:\n\n';

  for (const link of links) {
    const verdict = link.verdict ? ` - ${link.verdict.split('.')[0]}` : '';
    const risk = link.riskScore ? ` (Risk: ${link.riskScore}/100)` : '';
    md += `### ${link.proposalTitle}\n\n`;
    md += `- **Simulation:** [View on Tenderly](${link.simulationUrl})${verdict}${risk}\n`;
    md += `- **Fork ID:** \`${link.forkId}\`\n`;
    md += `- **Timestamp:** ${new Date(link.timestamp).toLocaleString()}\n\n`;
  }

  return md;
}

// Main
async function main() {
  console.log('🔍 Fetching Tenderly simulation links...\n');

  const links = await fetchSimulations();

  if (links.length === 0) {
    console.log('❌ No simulations found!');
    console.log('\nMake sure:');
    console.log('  1. Your app is running (npm run dev)');
    console.log('  2. You\'ve run at least one proposal simulation');
    console.log('  3. TENDERLY_ACCESS_KEY is set in .env\n');
    return;
  }

  console.log(`✅ Found ${links.length} simulation(s):\n`);

  for (const link of links) {
    console.log(`📊 ${link.proposalTitle}`);
    console.log(`   ${link.simulationUrl}\n`);
  }

  // Save to JSON
  writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
  console.log(`💾 Saved to ${LINKS_FILE}\n`);

  // Generate markdown
  const markdown = generateMarkdown(links);
  const mdFile = join(process.cwd(), 'TENDERLY_SIMULATIONS.md');
  writeFileSync(mdFile, markdown);
  console.log(`📝 Generated ${mdFile}\n`);

  // Show what to add to README
  console.log('📋 Copy this to your README.md:\n');
  console.log('─'.repeat(60));
  console.log(markdown);
  console.log('─'.repeat(60));
}

main().catch(console.error);
