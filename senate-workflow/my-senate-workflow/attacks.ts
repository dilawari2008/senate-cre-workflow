import type { AttackMatch, SimulationResult } from "./types";

const HISTORICAL_ATTACKS = [
  {
    id: "beanstalk-2022",
    name: "Beanstalk Flash Loan Governance Attack",
    protocol: "Beanstalk",
    date: "April 17, 2022",
    loss: "$182M",
    attackVector: "flash_loan_vote_capture",
    description:
      "Attacker borrowed ~$1B via flash loans from Aave to acquire 70%+ governance voting power, then passed BIP-18 through an emergencyCommit pathway to drain the protocol treasury.",
    indicators: [
      "flash loan or large token borrowing",
      "emergency or expedited execution pathway",
      "proposal that moves treasury funds",
      "single-transaction governance power acquisition",
      "bypasses normal timelock or voting delay",
    ],
    keywords: [
      "flash loan",
      "emergency",
      "emergencycommit",
      "borrow",
      "instant execution",
      "bypass timelock",
    ],
  },
  {
    id: "tornado-cash-2023",
    name: "Tornado Cash Governance Takeover",
    protocol: "Tornado Cash",
    date: "May 20, 2023",
    loss: "$900K+ (governance control)",
    attackVector: "malicious_lookalike_proposal",
    description:
      "A malicious proposal imitated a previously passed governance upgrade but contained a hidden function that granted the attacker ~1.2M fake TORN votes.",
    indicators: [
      "proposal that closely resembles a previously passed proposal",
      "hidden or obfuscated function calls in calldata",
      "self-destruct or logic swap patterns",
      "proposal grants voting power or minting authority",
      "bytecode differs from description",
    ],
    keywords: [
      "upgrade",
      "logic swap",
      "self-destruct",
      "selfdestruct",
      "hidden function",
      "grant votes",
      "mint votes",
    ],
  },
  {
    id: "build-finance-2022",
    name: "Build Finance Hostile DAO Takeover",
    protocol: "Build Finance",
    date: "February 14, 2022",
    loss: "$470K",
    attackVector: "hostile_takeover_quorum",
    description:
      "An attacker accumulated enough BUILD tokens to meet quorum, gained control of the governance contract, minted 1.1M+ BUILD tokens, and seized treasury and LP positions.",
    indicators: [
      "proposal to change minting authority or admin roles",
      "proposal from new or unknown address with concentrated voting power",
      "low quorum threshold being met by single holder",
      "proposal grants contract ownership or admin access",
      "rapid token accumulation before proposal",
    ],
    keywords: [
      "mint authority",
      "admin role",
      "ownership transfer",
      "change owner",
      "grant admin",
      "mint tokens",
    ],
  },
  {
    id: "compound-2024",
    name: "Compound Proposal 289 Whale Attack",
    protocol: "Compound",
    date: "July 2024",
    loss: "$24M (attempted)",
    attackVector: "whale_accumulation",
    description:
      "A crypto whale initiated Proposal 289 to move 499K COMP (~$24M) from the treasury to an externally controlled vault. It passed by a razor-thin margin during a weekend vote.",
    indicators: [
      "large treasury transfer to external address or new contract",
      "narrow vote margin or low turnout",
      "weekend or holiday timing",
      "single large voter dominates outcome",
      "newly created vault or contract as destination",
    ],
    keywords: [
      "treasury transfer",
      "move funds",
      "vault",
      "external contract",
      "goldcomp",
      "treasury to",
    ],
  },
  {
    id: "mango-markets-2022",
    name: "Mango Markets Exploit + Governance Settlement",
    protocol: "Mango Markets",
    date: "October 2022",
    loss: "$114M",
    attackVector: "market_manipulation_governance",
    description:
      "Exploiter manipulated MNGO perpetual futures prices to inflate collateral value, then borrowed $114M against it and proposed a governance settlement.",
    indicators: [
      "proposal related to exploit recovery or settlement",
      "proposal to whitelist or pay an attacker",
      "price oracle manipulation in simulation",
      "abnormal collateral value changes",
      "governance vote under duress or time pressure",
    ],
    keywords: [
      "settlement",
      "bounty",
      "exploit recovery",
      "return funds",
      "keep portion",
      "whitelist attacker",
    ],
  },
  {
    id: "synthetify-2023",
    name: "Synthetify Proposal Spam Drain",
    protocol: "Synthetify",
    date: "October 24, 2023",
    loss: "$230K",
    attackVector: "proposal_spam_low_engagement",
    description:
      "With the DAO inactive, an attacker created 10 nearly identical proposals; 9 were benign and the 10th sent ~$230K to the attacker's address.",
    indicators: [
      "multiple similar proposals submitted in short timeframe",
      "inactive DAO with low participation",
      "proposal includes fund transfer to external address",
      "proposal description is generic or copied",
      "low quorum met by proposer's own tokens",
    ],
    keywords: [
      "transfer to",
      "send to",
      "pay to",
      "fund transfer",
      "withdraw treasury",
    ],
  },
  {
    id: "steem-2020",
    name: "Steem Exchange Custody Vote Capture",
    protocol: "Steem",
    date: "March 2020",
    loss: "Network forked to Hive (governance integrity lost)",
    attackVector: "exchange_custody_capture",
    description:
      "Major exchanges powered up customer STEEM deposits and voted out community witnesses in favor of Justin Sun's account. The community forked to Hive.",
    indicators: [
      "sudden large increase in voting power from exchange-associated addresses",
      "proposal to replace validators or governance participants",
      "voting from custodial addresses",
      "coordinated voting from multiple exchange wallets",
      "proposal changes core governance structure",
    ],
    keywords: [
      "replace validator",
      "change witness",
      "governance structure",
      "voting power",
      "delegate authority",
    ],
  },
  {
    id: "mirror-2021",
    name: "Mirror Protocol Governance Poll Spam",
    protocol: "Mirror Protocol",
    date: "December 2021",
    loss: "Tens of millions (attempted, thwarted)",
    attackVector: "governance_poll_spam",
    description:
      "Attackers flooded Mirror Protocol governance with fake 'security' polls designed to redirect tens of millions in MIR to attacker addresses.",
    indicators: [
      "multiple governance proposals in rapid succession",
      "misleading proposal titles (security update, emergency fix)",
      "proposals redirect tokens to new addresses",
      "proposal descriptions don't match calldata",
      "proposals exploit confusing governance UX",
    ],
    keywords: [
      "security update",
      "emergency fix",
      "urgent",
      "critical patch",
      "immediate action",
    ],
  },
  {
    id: "indexed-finance-2023",
    name: "Indexed Finance DAO Drain Attempt",
    protocol: "Indexed Finance",
    date: "November 2023",
    loss: "$90K (attempted, defeated)",
    attackVector: "low_engagement_drain",
    description:
      "An attacker tried to pass a self-paying proposal on a neglected DAO with residual treasury funds. Only public scrutiny killed the proposal.",
    indicators: [
      "proposal on inactive or abandoned DAO",
      "treasury drain to proposer's address",
      "minimal discussion or community engagement",
      "quorum met with minimal unique voters",
      "no prior proposal history from proposer",
    ],
    keywords: [
      "drain",
      "withdraw all",
      "empty treasury",
      "remaining funds",
      "collect fees",
    ],
  },
] as const;

export function getHistoricalAttacksContext(): string {
  return HISTORICAL_ATTACKS.map((a) =>
    `- ${a.name} (${a.protocol}, ${a.date}): ${a.description} Loss: ${a.loss}. Attack vector: ${a.attackVector}. Indicators: ${a.indicators.join("; ")}`
  ).join("\n");
}

export function matchAttackPatterns(
  proposalTitle: string,
  proposalDescription: string,
  simResults: SimulationResult
): AttackMatch[] {
  const title = proposalTitle.toLowerCase();
  const desc = proposalDescription.toLowerCase();
  const matches: AttackMatch[] = [];

  for (const attack of HISTORICAL_ATTACKS) {
    let score = 0;
    const matchedIndicators: string[] = [];
    let keywordsMatched = 0;

    for (const keyword of attack.keywords) {
      const inTitle = title.includes(keyword);
      const inDesc = desc.includes(keyword);
      if (inTitle) {
        keywordsMatched++;
        matchedIndicators.push(`"${keyword}" (title)`);
      } else if (inDesc) {
        keywordsMatched++;
        matchedIndicators.push(`"${keyword}" (description)`);
      }
    }

    if (keywordsMatched > 0) {
      const keywordRatio = keywordsMatched / attack.keywords.length;
      score += Math.round(keywordRatio * 55);
    }

    for (const indicator of attack.indicators) {
      const words = indicator.toLowerCase().split(/\s+/);
      const significantWords = words.filter(w => w.length > 4);
      const hitCount = significantWords.filter(w => title.includes(w) || desc.includes(w)).length;
      if (significantWords.length > 0 && hitCount >= Math.ceil(significantWords.length * 0.4)) {
        score += 5;
        matchedIndicators.push(indicator);
      }
    }

    if (simResults.tvlChangePct < -10) {
      score += 12;
      matchedIndicators.push(`Large TVL decrease: ${simResults.tvlChangePct}%`);
    }
    if (simResults.liquidationRisk > 70) {
      score += 12;
      matchedIndicators.push(`High liquidation risk: ${simResults.liquidationRisk}/100`);
    }
    if (simResults.affectedAddresses > 5000) {
      score += 8;
      matchedIndicators.push(`Many affected addresses: ${simResults.affectedAddresses}`);
    }
    const collateralDrop = simResults.collateralRatioBefore - simResults.collateralRatioAfter;
    if (collateralDrop > 0.3) {
      score += 10;
      matchedIndicators.push(`Significant collateral ratio drop: ${collateralDrop.toFixed(2)}x`);
    }
    if (simResults.gasUsed > 1_000_000) {
      score += 5;
      matchedIndicators.push(`Complex execution (high gas): ${simResults.gasUsed}`);
    }

    if (score >= 10) {
      matches.push({
        patternId: attack.id,
        name: `${attack.name} (${attack.protocol}, ${attack.date})`,
        similarity: Math.min(100, score),
        historicalLoss: attack.loss,
        date: attack.date,
        description: attack.description,
        indicators: matchedIndicators,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
