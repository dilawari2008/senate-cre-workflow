// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SenateGovernor
 * @notice Mock governance contract that emits ProposalCreated events.
 *         These events trigger the Senate CRE workflow to analyze proposals.
 */
contract SenateGovernor is Ownable {

    struct Proposal {
        string  title;
        string  protocol;
        string  description;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        bool    exists;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        string  title,
        string  protocol,
        string  description,
        address indexed proposer,
        uint256 startBlock,
        uint256 endBlock
    );

    event ProposalCancelled(uint256 indexed proposalId);

    constructor() Ownable(msg.sender) {}

    function createProposal(
        string calldata _title,
        string calldata _protocol,
        string calldata _description,
        uint256 _votingPeriodBlocks
    ) external returns (uint256) {
        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            title: _title,
            protocol: _protocol,
            description: _description,
            proposer: msg.sender,
            startBlock: block.number,
            endBlock: block.number + _votingPeriodBlocks,
            exists: true
        });

        emit ProposalCreated(
            proposalId,
            _title,
            _protocol,
            _description,
            msg.sender,
            block.number,
            block.number + _votingPeriodBlocks
        );

        return proposalId;
    }

    function cancelProposal(uint256 _proposalId) external onlyOwner {
        require(proposals[_proposalId].exists, "Proposal not found");
        delete proposals[_proposalId];
        emit ProposalCancelled(_proposalId);
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        require(proposals[_proposalId].exists, "Proposal not found");
        return proposals[_proposalId];
    }
}
