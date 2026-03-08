#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
WORKFLOW_DIR="$ROOT/senate-workflow"
PAYLOADS_DIR="$WORKFLOW_DIR/payloads"

export PATH="$HOME/.cre/bin:$PATH"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     SENATE — CRE Workflow Simulator       ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"

if ! command -v cre &> /dev/null; then
  echo -e "${RED}CRE CLI not found. Install it:${NC}"
  echo "  curl -sSL https://cre.chain.link/install.sh | bash"
  exit 1
fi

show_help() {
  echo "Usage: ./senate-cre.sh <scenario> [--broadcast]"
  echo ""
  echo "Scenarios:"
  echo -e "  ${RED}a${NC}  Malicious treasury drain     (expected: unanimous FAIL, high risk)"
  echo -e "  ${GREEN}b${NC}  Safe collateral addition     (expected: unanimous PASS, low risk)"
  echo -e "  ${YELLOW}c${NC}  Harmful fee change           (expected: split vote, moderate risk)"
  echo -e "  ${YELLOW}d${NC}  Reserve factor reduction     (expected: vote change during debate)"
  echo -e "  ${RED}e${NC}  Emergency minting authority   (expected: vote change, attack pattern)"
  echo ""
  echo "Options:"
  echo "  --broadcast   Actually broadcast EVM transactions on-chain"
  echo ""
  echo "Examples:"
  echo "  ./senate-cre.sh a              # Run malicious proposal scenario"
  echo "  ./senate-cre.sh b --broadcast  # Run safe proposal with on-chain write"
  echo "  ./senate-cre.sh cron           # Run the staleness check (cron trigger)"
  echo ""
  echo "Prerequisites:"
  echo "  1. Hardhat node running on :8545  (./start.sh handles this)"
  echo "  2. Contracts deployed              (./start.sh handles this)"
  echo "  3. Next.js running on :3000        (./start.sh handles this)"
}

if [ -z "$1" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  show_help
  exit 0
fi

SCENARIO="$1"
BROADCAST_FLAG=""
if [ "$2" = "--broadcast" ]; then
  BROADCAST_FLAG="--broadcast"
fi

case "$SCENARIO" in
  a|malicious)
    PAYLOAD_FILE="$PAYLOADS_DIR/scenario-a-malicious.json"
    TRIGGER_INDEX=0
    echo -e "${RED}Scenario A: Malicious Treasury Drain${NC}"
    echo "  Proposal: Emergency Transfer 500K COMP to External Multisig"
    echo "  Expected: Unanimous FAIL, risk 90+, attack pattern match"
    ;;
  b|safe)
    PAYLOAD_FILE="$PAYLOADS_DIR/scenario-b-safe.json"
    TRIGGER_INDEX=0
    echo -e "${GREEN}Scenario B: Safe Collateral Addition${NC}"
    echo "  Proposal: Add WBTC as Collateral on Aave V3"
    echo "  Expected: Unanimous PASS, risk <25"
    ;;
  c|split)
    PAYLOAD_FILE="$PAYLOADS_DIR/scenario-c-split.json"
    TRIGGER_INDEX=0
    echo -e "${YELLOW}Scenario C: Split Vote — Harmful Fee Change${NC}"
    echo "  Proposal: Increase UNI/ETH Pool Fee"
    echo "  Expected: Mixed votes, moderate risk"
    ;;
  d|change)
    PAYLOAD_FILE="$PAYLOADS_DIR/scenario-d-vote-change.json"
    TRIGGER_INDEX=0
    echo -e "${YELLOW}Scenario D: Vote Change During Debate${NC}"
    echo "  Proposal: Reduce USDC Reserve Factor"
    echo "  Expected: Agent changes vote after counter-argument"
    ;;
  e|emergency)
    PAYLOAD_FILE="$PAYLOADS_DIR/scenario-e-emergency.json"
    TRIGGER_INDEX=0
    echo -e "${RED}Scenario E: Emergency Minting Authority${NC}"
    echo "  Proposal: Grant Emergency Minting to Core Team"
    echo "  Expected: Vote change, attack pattern match"
    ;;
  cron|staleness)
    TRIGGER_INDEX=2
    echo -e "${CYAN}Cron: Risk Score Staleness Check${NC}"
    echo "  Checking SenateRiskOracle for stale protocol scores"
    ;;
  *)
    echo -e "${RED}Unknown scenario: $SCENARIO${NC}"
    show_help
    exit 1
    ;;
esac

echo ""
echo -e "${CYAN}Running CRE workflow simulate...${NC}"
echo "─────────────────────────────────────────────────"

cd "$WORKFLOW_DIR"

if [ "$SCENARIO" = "cron" ] || [ "$SCENARIO" = "staleness" ]; then
  cre workflow simulate my-senate-workflow \
    --target local-simulation \
    --non-interactive \
    --trigger-index "$TRIGGER_INDEX" \
    $BROADCAST_FLAG \
    -e .env
else
  cre workflow simulate my-senate-workflow \
    --target local-simulation \
    --non-interactive \
    --trigger-index "$TRIGGER_INDEX" \
    --http-payload "$PAYLOAD_FILE" \
    $BROADCAST_FLAG \
    -e .env
fi

echo ""
echo "─────────────────────────────────────────────────"
echo -e "${GREEN}CRE workflow simulation complete.${NC}"
echo -e "Check ${CYAN}http://localhost:3000${NC} for results."
