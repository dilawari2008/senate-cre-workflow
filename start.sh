#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$ROOT/contracts"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  [ -n "$HARDHAT_PID" ] && kill "$HARDHAT_PID" 2>/dev/null && echo "  Hardhat node stopped"
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null && echo "  Next.js dev server stopped"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║         SENATE — Full Stack Startup       ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 0: Kill anything on port 8545 / 3000 ──
echo -e "${YELLOW}[0/4] Freeing ports 8545 and 3000...${NC}"
lsof -ti:8545 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# ── Step 1: Start Hardhat node ──
echo -e "${CYAN}[1/4] Starting Hardhat local node...${NC}"
cd "$CONTRACTS_DIR"
npx hardhat node > /tmp/senate-hardhat.log 2>&1 &
HARDHAT_PID=$!

echo "  Waiting for Hardhat node (pid $HARDHAT_PID)..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "  ${GREEN}Hardhat node is ready on http://127.0.0.1:8545${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "  ${RED}Hardhat node failed to start. Check /tmp/senate-hardhat.log${NC}"
    exit 1
  fi
  sleep 1
done

# ── Step 2: Compile contracts ──
echo -e "${CYAN}[2/4] Compiling contracts...${NC}"
cd "$CONTRACTS_DIR"
npx hardhat compile --quiet
echo -e "  ${GREEN}Contracts compiled${NC}"

# ── Step 3: Deploy contracts + seed demo data ──
echo -e "${CYAN}[3/4] Deploying contracts and seeding demo data...${NC}"
cd "$CONTRACTS_DIR"
npx hardhat run scripts/deploy-all.ts --network localhost
echo -e "  ${GREEN}Contracts deployed and demo data seeded${NC}"

# ── Step 4: Start Next.js dev server ──
echo -e "${CYAN}[4/4] Starting Next.js dev server...${NC}"
cd "$ROOT"
npx next dev > /tmp/senate-nextjs.log 2>&1 &
NEXT_PID=$!

echo "  Waiting for Next.js (pid $NEXT_PID)..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}Next.js ready on http://localhost:3000${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "  ${YELLOW}Next.js may still be compiling — check http://localhost:3000 in a moment${NC}"
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               SENATE IS READY                        ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:   http://localhost:3000                   ║${NC}"
echo -e "${GREEN}║  Admin:      http://localhost:3000/admin             ║${NC}"
echo -e "${GREEN}║  Hardhat:    http://127.0.0.1:8545                   ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  CRE Workflow (run in another terminal):             ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh a   # Malicious proposal          ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh b   # Safe proposal               ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh c   # Split vote                  ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh d   # Vote change                 ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh e   # Emergency minting           ║${NC}"
echo -e "${GREEN}║    ./senate-cre.sh --help  for all options            ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop everything                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

wait
