// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SenateRiskOracle
 * @notice On-chain oracle for querying Senate risk assessments.
 *         Tracks protocol-level and proposal-level risk scores updated by the Senate CRE pipeline.
 *         Acts as a "protocol safeguard trigger" — other contracts can query risk thresholds
 *         before executing governance actions.
 */
contract SenateRiskOracle is Ownable {

    struct RiskAssessment {
        uint8   riskScore;       // 0-100
        uint8   recommendation;  // 0 = PASS, 1 = FAIL, 2 = ABSTAIN
        uint64  updatedAt;
        bytes32 reportHash;
    }

    struct ProtocolRisk {
        string  protocol;
        uint8   avgRiskScore;
        uint256 totalAssessments;
        uint64  lastUpdated;
    }

    mapping(bytes32 => RiskAssessment) public assessments;
    mapping(string => ProtocolRisk) public protocolRisks;
    string[] public trackedProtocols;

    uint8 public riskThreshold = 70;

    address public updater;

    event RiskUpdated(
        bytes32 indexed proposalHash,
        string  protocol,
        uint8   riskScore,
        uint8   recommendation,
        bytes32 reportHash
    );

    event ProtocolRiskUpdated(
        string  protocol,
        uint8   avgRiskScore,
        uint256 totalAssessments
    );

    event ThresholdUpdated(uint8 oldThreshold, uint8 newThreshold);

    event RiskBreached(
        bytes32 indexed proposalHash,
        string  protocol,
        uint8   riskScore,
        uint8   threshold
    );

    modifier onlyUpdater() {
        require(
            msg.sender == updater || msg.sender == owner(),
            "SenateRiskOracle: unauthorized"
        );
        _;
    }

    constructor(address _updater) Ownable(msg.sender) {
        updater = _updater;
    }

    function setUpdater(address _updater) external onlyOwner {
        updater = _updater;
    }

    function setRiskThreshold(uint8 _threshold) external onlyOwner {
        require(_threshold <= 100, "Invalid threshold");
        uint8 old = riskThreshold;
        riskThreshold = _threshold;
        emit ThresholdUpdated(old, _threshold);
    }

    function updateRisk(
        bytes32 _proposalHash,
        string  calldata _protocol,
        uint8   _riskScore,
        uint8   _recommendation,
        bytes32 _reportHash
    ) external onlyUpdater {
        require(_riskScore <= 100, "Risk score out of range");
        require(_recommendation <= 2, "Invalid recommendation");

        assessments[_proposalHash] = RiskAssessment({
            riskScore: _riskScore,
            recommendation: _recommendation,
            updatedAt: uint64(block.timestamp),
            reportHash: _reportHash
        });

        emit RiskUpdated(_proposalHash, _protocol, _riskScore, _recommendation, _reportHash);

        _updateProtocolRisk(_protocol, _riskScore);

        if (_riskScore >= riskThreshold) {
            emit RiskBreached(_proposalHash, _protocol, _riskScore, riskThreshold);
        }
    }

    function _updateProtocolRisk(string calldata _protocol, uint8 _riskScore) internal {
        ProtocolRisk storage pr = protocolRisks[_protocol];

        if (pr.totalAssessments == 0) {
            trackedProtocols.push(_protocol);
            pr.protocol = _protocol;
        }

        uint256 newTotal = pr.totalAssessments + 1;
        pr.avgRiskScore = uint8(
            (uint256(pr.avgRiskScore) * pr.totalAssessments + _riskScore) / newTotal
        );
        pr.totalAssessments = newTotal;
        pr.lastUpdated = uint64(block.timestamp);

        emit ProtocolRiskUpdated(_protocol, pr.avgRiskScore, newTotal);
    }

    function isHighRisk(bytes32 _proposalHash) external view returns (bool) {
        return assessments[_proposalHash].riskScore >= riskThreshold;
    }

    function getRisk(bytes32 _proposalHash) external view returns (RiskAssessment memory) {
        return assessments[_proposalHash];
    }

    function getProtocolRisk(string calldata _protocol) external view returns (ProtocolRisk memory) {
        return protocolRisks[_protocol];
    }

    function getTrackedProtocolCount() external view returns (uint256) {
        return trackedProtocols.length;
    }
}
