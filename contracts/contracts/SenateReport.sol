// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SenateReport
 * @notice CRE consumer contract that stores DON-verified governance reports.
 *         In production this inherits ReceiverTemplate; for the hackathon demo
 *         we use a simplified interface that a MockKeystoneForwarder can call.
 */
contract SenateReport is Ownable {

    struct Report {
        bytes32 proposalHash;
        bytes32 contentHash;
        uint8   recommendation; // 0 = PASS, 1 = FAIL, 2 = ABSTAIN
        uint8   riskScore;      // 0-100
        uint64  timestamp;
        address transmitter;
    }

    uint256 public reportCount;
    mapping(uint256 => Report) public reports;
    mapping(bytes32 => uint256) public proposalToReportId;

    address public keystoneForwarder;

    event ReportPublished(
        uint256 indexed reportId,
        bytes32 indexed proposalHash,
        bytes32 contentHash,
        uint8   recommendation,
        uint8   riskScore,
        address transmitter
    );

    event ForwarderUpdated(address oldForwarder, address newForwarder);

    modifier onlyForwarder() {
        require(
            msg.sender == keystoneForwarder || msg.sender == owner(),
            "SenateReport: unauthorized"
        );
        _;
    }

    constructor(address _keystoneForwarder) Ownable(msg.sender) {
        keystoneForwarder = _keystoneForwarder;
        emit ForwarderUpdated(address(0), _keystoneForwarder);
    }

    function setKeystoneForwarder(address _forwarder) external onlyOwner {
        address old = keystoneForwarder;
        keystoneForwarder = _forwarder;
        emit ForwarderUpdated(old, _forwarder);
    }

    /**
     * @notice Simplified report receiver for hackathon demo.
     *         In production the CRE DON calls _processReport via KeystoneForwarder.
     */
    function publishReport(
        bytes32 _proposalHash,
        bytes32 _contentHash,
        uint8   _recommendation,
        uint8   _riskScore
    ) external onlyForwarder {
        require(_recommendation <= 2, "Invalid recommendation");
        require(_riskScore <= 100, "Risk score out of range");

        reportCount++;
        uint256 reportId = reportCount;

        reports[reportId] = Report({
            proposalHash: _proposalHash,
            contentHash: _contentHash,
            recommendation: _recommendation,
            riskScore: _riskScore,
            timestamp: uint64(block.timestamp),
            transmitter: msg.sender
        });

        proposalToReportId[_proposalHash] = reportId;

        emit ReportPublished(
            reportId,
            _proposalHash,
            _contentHash,
            _recommendation,
            _riskScore,
            msg.sender
        );
    }

    function getReport(uint256 _reportId) external view returns (Report memory) {
        require(_reportId > 0 && _reportId <= reportCount, "Report not found");
        return reports[_reportId];
    }

    function getReportByProposal(bytes32 _proposalHash) external view returns (Report memory) {
        uint256 reportId = proposalToReportId[_proposalHash];
        require(reportId > 0, "No report for proposal");
        return reports[reportId];
    }
}
