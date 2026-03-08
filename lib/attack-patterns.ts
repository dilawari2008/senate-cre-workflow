import { IAttackMatch, ISimulationMetrics } from '@/types';

export interface HistoricalAttack {
  id: string;
  name: string;
  protocol: string;
  date: string;
  loss: string;
  lossUsd: number;
  attackVector: string;
  description: string;
  indicators: string[];
  category: string;
  source: string;
}

export const HISTORICAL_ATTACKS: HistoricalAttack[] = [
  {
    id: 'beanstalk-2022',
    name: 'Beanstalk Flash Loan Governance Attack',
    protocol: 'Beanstalk',
    date: 'April 17, 2022',
    loss: '$182M',
    lossUsd: 182_000_000,
    attackVector: 'flash_loan_vote_capture',
    description:
      'Attacker borrowed ~$1B via flash loans from Aave to acquire 70%+ governance voting power, then passed BIP-18 through an emergencyCommit pathway to drain the protocol treasury. BEAN stablecoin crashed 88% to $0.12.',
    indicators: [
      'Flash loan or large token borrowing',
      'Emergency or expedited execution pathway',
      'Proposal that moves treasury funds',
      'Single-transaction governance power acquisition',
      'Bypasses normal timelock or voting delay',
    ],
    category: 'Flash Loan Vote Capture',
    source: 'https://www.coindesk.com/tech/2022/04/17/attacker-drains-182m-from-beanstalk-stablecoin-protocol',
  },
  {
    id: 'tornado-cash-2023',
    name: 'Tornado Cash Governance Takeover',
    protocol: 'Tornado Cash',
    date: 'May 20, 2023',
    loss: '$900K+ (governance control)',
    lossUsd: 900_000,
    attackVector: 'malicious_lookalike_proposal',
    description:
      'A malicious proposal imitated a previously passed governance upgrade but contained a hidden function that granted the attacker ~1.2M fake TORN votes. This gave full governance control, allowing withdrawal of locked governance assets.',
    indicators: [
      'Proposal closely resembles a previously passed proposal',
      'Hidden or obfuscated function calls in calldata',
      'Self-destruct or logic swap patterns',
      'Proposal grants voting power or minting authority',
      'Bytecode differs from description',
    ],
    category: 'Malicious Lookalike Proposal',
    source: 'https://www.coindesk.com/tech/2023/05/21/attacker-takes-over-tornado-cash-dao-with-vote-fraud-token-slumps-40',
  },
  {
    id: 'build-finance-2022',
    name: 'Build Finance Hostile DAO Takeover',
    protocol: 'Build Finance',
    date: 'February 14, 2022',
    loss: '$470K (treasury + LP drained)',
    lossUsd: 470_000,
    attackVector: 'hostile_takeover_quorum',
    description:
      'An attacker accumulated enough BUILD tokens to meet quorum, gained control of the governance contract, minted 1.1M+ BUILD tokens, and seized treasury and LP positions. The token collapsed to near-zero.',
    indicators: [
      'Proposal to change minting authority or admin roles',
      'Proposal from new or unknown address with concentrated voting power',
      'Low quorum threshold being met by single holder',
      'Proposal grants contract ownership or admin access',
      'Rapid token accumulation before proposal',
    ],
    category: 'Hostile DAO Takeover',
    source: 'https://cryptoslate.com/build-finance-dao-hostile-takeover-treasury-drained/',
  },
  {
    id: 'compound-2024',
    name: 'Compound Proposal 289 Whale Attack',
    protocol: 'Compound',
    date: 'July 2024',
    loss: '$24M (attempted, later withdrawn)',
    lossUsd: 24_000_000,
    attackVector: 'whale_accumulation',
    description:
      "A crypto whale (Humpy) initiated Proposal 289 to move 499K COMP (~$24M) from the treasury to an externally controlled 'goldCOMP' vault. It passed by a razor-thin margin during a weekend vote with low turnout. Security advisors labeled it a governance attack; the proposer agreed to cancel.",
    indicators: [
      'Large treasury transfer to external address or new contract',
      'Narrow vote margin or low turnout',
      'Weekend or holiday timing',
      'Single large voter dominates outcome',
      'Newly created vault or contract as destination',
    ],
    category: 'Whale Accumulation Attack',
    source: 'https://www.theblock.co/post/308215/compound-reaches-truce-with-crypto-whale-humpy',
  },
  {
    id: 'mango-markets-2022',
    name: 'Mango Markets Exploit + Governance Settlement',
    protocol: 'Mango Markets',
    date: 'October 2022',
    loss: '$114M',
    lossUsd: 114_000_000,
    attackVector: 'market_manipulation_governance',
    description:
      'Exploiter Avraham Eisenberg manipulated MNGO perpetual futures prices to inflate his collateral value, then borrowed $114M against it. He proposed a governance "deal" to return ~$67M if allowed to keep ~$47M. The DAO approved under duress.',
    indicators: [
      'Proposal related to exploit recovery or settlement',
      'Proposal to whitelist or pay an attacker',
      'Price oracle manipulation in simulation',
      'Abnormal collateral value changes',
      'Governance vote under duress or time pressure',
    ],
    category: 'Market Manipulation + Governance',
    source: 'https://www.theblock.co/post/176468/mango-markets-attacker-puts-forward-proposal',
  },
  {
    id: 'synthetify-2023',
    name: 'Synthetify Proposal Spam Drain',
    protocol: 'Synthetify',
    date: 'October 24, 2023',
    loss: '$230K',
    lossUsd: 230_000,
    attackVector: 'proposal_spam_low_engagement',
    description:
      "With the DAO inactive, an attacker created 10 nearly identical proposals; 9 were benign, the 10th sent ~$230K to the attacker's address. By the time anyone noticed, funds had moved.",
    indicators: [
      'Multiple similar proposals submitted in short timeframe',
      'Inactive DAO with low participation',
      'Proposal includes fund transfer to external address',
      'Proposal description is generic or copied',
      'Low quorum met by proposer\'s own tokens',
    ],
    category: 'Proposal Spam / Low-Engagement Drain',
    source: 'https://blockworks.co/news/solana-exploit-dao-hacker',
  },
  {
    id: 'steem-2020',
    name: 'Steem Exchange Custody Vote Capture',
    protocol: 'Steem',
    date: 'March 2020',
    loss: 'Network forked to Hive (governance integrity lost)',
    lossUsd: 0,
    attackVector: 'exchange_custody_capture',
    description:
      "Major exchanges (Binance, Huobi, Poloniex) powered up customer STEEM deposits and voted out community witnesses in favor of Justin Sun's account. The community forked to Hive in response.",
    indicators: [
      'Sudden large increase in voting power from exchange-associated addresses',
      'Proposal to replace validators or governance participants',
      'Voting from custodial addresses',
      'Coordinated voting from multiple exchange wallets',
      'Proposal changes core governance structure',
    ],
    category: 'Exchange Custody Vote Capture',
    source: 'https://www.coindesk.com/markets/2020/03/20/steem-hard-forks-today-over-fears-of-justin-sun-power-grab',
  },
  {
    id: 'mirror-2021',
    name: 'Mirror Protocol Governance Poll Spam',
    protocol: 'Mirror Protocol',
    date: 'December 2021',
    loss: 'Tens of millions (attempted, thwarted)',
    lossUsd: 0,
    attackVector: 'governance_poll_spam',
    description:
      "Attackers flooded Mirror Protocol's governance with fake 'security' polls designed to redirect tens of millions in MIR to attacker addresses. Community vigilance detected and defeated the attack.",
    indicators: [
      'Multiple governance proposals in rapid succession',
      'Misleading proposal titles (security update, emergency fix)',
      'Proposals redirect tokens to new addresses',
      'Proposal descriptions don\'t match calldata',
      'Proposals exploit confusing governance UX',
    ],
    category: 'Governance Poll Spam',
    source: 'https://cointelegraph.com/news/terra-s-mirror-protocol-warns-community-against-governance-attack',
  },
  {
    id: 'indexed-finance-2023',
    name: 'Indexed Finance DAO Drain Attempt',
    protocol: 'Indexed Finance',
    date: 'November 2023',
    loss: '$90K (attempted, defeated)',
    lossUsd: 90_000,
    attackVector: 'low_engagement_drain',
    description:
      "An attacker tried to pass a self-paying proposal on a neglected DAO with residual treasury funds. Only public scrutiny and quick community mobilization killed the proposal.",
    indicators: [
      'Proposal on inactive or abandoned DAO',
      'Treasury drain to proposer\'s address',
      'Minimal discussion or community engagement',
      'Quorum met with minimal unique voters',
      'No prior proposal history from proposer',
    ],
    category: 'Low-Engagement Drain',
    source: 'https://blockworks.co/news/blackmail-thwarts-90k-dao-attack',
  },
];

const ATTACK_KEYWORDS: Record<string, string[]> = {
  'beanstalk-2022': ['flash loan', 'emergency', 'emergencycommit', 'borrow', 'instant execution', 'bypass timelock'],
  'tornado-cash-2023': ['upgrade', 'logic swap', 'self-destruct', 'selfdestruct', 'hidden function', 'grant votes', 'mint votes'],
  'build-finance-2022': ['mint authority', 'admin role', 'ownership transfer', 'change owner', 'grant admin', 'mint tokens'],
  'compound-2024': ['treasury transfer', 'move funds', 'vault', 'external contract', 'goldcomp', 'treasury to'],
  'mango-markets-2022': ['settlement', 'bounty', 'exploit recovery', 'return funds', 'keep portion', 'whitelist attacker'],
  'synthetify-2023': ['transfer to', 'send to', 'pay to', 'fund transfer', 'withdraw treasury'],
  'steem-2020': ['replace validator', 'change witness', 'governance structure', 'voting power', 'delegate authority'],
  'mirror-2021': ['security update', 'emergency fix', 'urgent', 'critical patch', 'immediate action'],
  'indexed-finance-2023': ['drain', 'withdraw all', 'empty treasury', 'remaining funds', 'collect fees'],
};

export function matchAttackPatterns(
  proposalTitle: string,
  proposalDescription: string,
  metrics: ISimulationMetrics
): IAttackMatch[] {
  const text = `${proposalTitle} ${proposalDescription}`.toLowerCase();
  const matches: IAttackMatch[] = [];

  for (const attack of HISTORICAL_ATTACKS) {
    let score = 0;
    const matchedIndicators: string[] = [];

    const keywords = ATTACK_KEYWORDS[attack.id] || [];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 20;
        matchedIndicators.push(keyword);
      }
    }

    if (metrics.tvlChangePct < -10) {
      score += 15;
      matchedIndicators.push(`Large TVL decrease: ${metrics.tvlChangePct}%`);
    }

    if (metrics.liquidationRisk > 70) {
      score += 15;
      matchedIndicators.push(`High liquidation risk: ${metrics.liquidationRisk}/100`);
    }

    if (metrics.affectedAddresses > 5000) {
      score += 10;
      matchedIndicators.push(`Many affected addresses: ${metrics.affectedAddresses}`);
    }

    const collateralDrop = metrics.collateralRatioBefore - metrics.collateralRatioAfter;
    if (collateralDrop > 0.3) {
      score += 15;
      matchedIndicators.push(`Significant collateral ratio drop: ${collateralDrop.toFixed(2)}x`);
    }

    if (metrics.gasUsed > 1_000_000) {
      score += 5;
      matchedIndicators.push(`Complex execution (high gas): ${metrics.gasUsed}`);
    }

    if (score >= 15) {
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
