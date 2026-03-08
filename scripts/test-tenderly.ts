#!/usr/bin/env tsx
/**
 * Test Tenderly API connection and get simulation URLs
 * 
 * Usage: npx tsx scripts/test-tenderly.ts
 */

import { config } from 'dotenv';
config();

const TENDERLY_ACCOUNT = process.env.TENDERLY_ACCOUNT;
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || 'senate';
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY;

async function testTenderlyConnection() {
  console.log('🔍 Testing Tenderly Configuration...\n');

  // Check environment variables
  if (!TENDERLY_ACCOUNT) {
    console.error('❌ TENDERLY_ACCOUNT not set in .env');
    return false;
  }
  if (!TENDERLY_ACCESS_KEY) {
    console.error('❌ TENDERLY_ACCESS_KEY not set in .env');
    return false;
  }

  console.log('✅ Environment variables found:');
  console.log(`   Account: ${TENDERLY_ACCOUNT}`);
  console.log(`   Project: ${TENDERLY_PROJECT}\n`);

  // Test API connection
  try {
    console.log('📡 Testing API connection...');
    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}`,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.error('   → Check your TENDERLY_ACCESS_KEY');
      } else if (response.status === 404) {
        console.error('   → Check your TENDERLY_ACCOUNT and TENDERLY_PROJECT');
      }
      return false;
    }

    const project = await response.json();
    console.log(`✅ Connected to project: ${project.name || TENDERLY_PROJECT}\n`);

    // Fetch recent simulations
    console.log('📊 Fetching recent simulations...');
    const simsResponse = await fetch(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulations`,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY,
        },
      }
    );

    if (simsResponse.ok) {
      const sims = await simsResponse.json();
      const simulations = sims.simulations || [];
      
      if (simulations.length === 0) {
        console.log('⚠️  No simulations found yet.');
        console.log('   Run a proposal in your app to create one!\n');
      } else {
        console.log(`✅ Found ${simulations.length} simulation(s):\n`);
        
        for (let i = 0; i < Math.min(5, simulations.length); i++) {
          const sim = simulations[i];
          const url = `https://dashboard.tenderly.co/${TENDERLY_ACCOUNT}/${TENDERLY_PROJECT}/simulator/${sim.id}`;
          const date = new Date(sim.created_at).toLocaleString();
          console.log(`${i + 1}. ${date}`);
          console.log(`   ${url}`);
          console.log(`   Status: ${sim.status || 'success'}\n`);
        }
      }
    }

    // Show example simulation URL format
    console.log('📋 Your simulation URL format:');
    console.log(`   https://dashboard.tenderly.co/${TENDERLY_ACCOUNT}/${TENDERLY_PROJECT}/simulator/{SIMULATION_ID}\n`);

    // Check for Virtual TestNets
    console.log('🌐 Checking for Virtual TestNets...');
    const vtnResponse = await fetch(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/vnets`,
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY,
        },
      }
    );

    if (vtnResponse.ok) {
      const vtns = await vtnResponse.json();
      if (vtns.length === 0) {
        console.log('⚠️  No Virtual TestNets found.');
        console.log('   Create one at: https://dashboard.tenderly.co\n');
      } else {
        console.log(`✅ Found ${vtns.length} Virtual TestNet(s):\n`);
        for (const vtn of vtns) {
          console.log(`   Name: ${vtn.name || vtn.id}`);
          console.log(`   Explorer: https://dashboard.tenderly.co/explorer/vnet/${vtn.id}`);
          console.log(`   RPC: ${vtn.rpc_url || 'N/A'}\n`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

// Test simulation API call
async function testSimulationAPI() {
  console.log('\n🧪 Testing Simulation API...\n');

  try {
    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': TENDERLY_ACCESS_KEY!,
        },
        body: JSON.stringify({
          network_id: '1',
          from: '0x0000000000000000000000000000000000000001',
          to: '0x0000000000000000000000000000000000000001',
          input: '0x',
          gas: 21000,
          gas_price: '0',
          value: '0',
          save: true,
          save_if_fails: true,
          simulation_type: 'quick',
        }),
      }
    );

    if (!response.ok) {
      console.error(`❌ Simulation API error: ${response.status}`);
      const text = await response.text();
      console.error(`   ${text}\n`);
      return false;
    }

    const result = await response.json();
    const simId = result.simulation?.id;
    
    if (simId) {
      console.log('✅ Test simulation successful!');
      console.log(`   Simulation ID: ${simId}`);
      console.log(`   URL: https://dashboard.tenderly.co/${TENDERLY_ACCOUNT}/${TENDERLY_PROJECT}/simulator/${simId}\n`);
      return true;
    } else {
      console.error('❌ Simulation created but no ID returned\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Simulation test failed:', error);
    return false;
  }
}

// Main
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   TENDERLY CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════\n');

  const connectionOk = await testTenderlyConnection();
  
  if (connectionOk) {
    const simOk = await testSimulationAPI();
    
    if (simOk) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ ALL TESTS PASSED!');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('Next steps:');
      console.log('1. Run your app: npm run dev');
      console.log('2. Submit a proposal and run simulation');
      console.log('3. Capture links: npm run capture-links\n');
    }
  } else {
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ TESTS FAILED');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Fix the issues above and try again.\n');
    process.exit(1);
  }
}

main().catch(console.error);
