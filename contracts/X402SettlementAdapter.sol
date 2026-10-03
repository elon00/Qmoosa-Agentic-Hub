// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title X402SettlementAdapter
 * @notice On-chain settlement gateway for x402 Bazaar Protocol on Polkadot.
 * Verifies micropayments between autonomous AI agents and paid API services.
 */
contract X402SettlementAdapter {
    address public owner;
    address public feeCollector;
    uint256 public protocolFeeBps = 100; // 1% facilitator fee

    struct Invoice {
        bytes32 challengeId;
        address payer;
        address payee;
        uint256 amount;
        uint256 settledAt;
        bool isSettled;
    }

    mapping(bytes32 => Invoice) public invoices;

    event PaymentSettled(
        bytes32 indexed challengeId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller not owner");
        _;
    }

    constructor(address _feeCollector) {
        owner = msg.sender;
        feeCollector = _feeCollector;
    }

    /**
     * @notice Pay an HTTP 402 challenge using native DOT
     * @param challengeId Unique hash provided by the x402 API gateway
     * @param payee The merchant / agent wallet providing the service
     */
    function settleDot(bytes32 challengeId, address payee) external payable {
        require(msg.value > 0, "Zero payment");
        require(!invoices[challengeId].isSettled, "Invoice already settled");
        require(payee != address(0), "Invalid payee");

        uint256 fee = (msg.value * protocolFeeBps) / 10000;
        uint256 netPayment = msg.value - fee;

        invoices[challengeId] = Invoice({
            challengeId: challengeId,
            payer: msg.sender,
            payee: payee,
            amount: msg.value,
            settledAt: block.timestamp,
            isSettled: true
        });

        if (fee > 0) {
            (bool successFee, ) = feeCollector.call{value: fee}("");
            require(successFee, "Fee transfer failed");
        }

        (bool successPayee, ) = payee.call{value: netPayment}("");
        require(successPayee, "Payee transfer failed");

        emit PaymentSettled(challengeId, msg.sender, payee, msg.value, block.timestamp);
    }

    function isInvoiceSettled(bytes32 challengeId) external view returns (bool) {
        return invoices[challengeId].isSettled;
    }

    function getInvoice(bytes32 challengeId) external view returns (Invoice memory) {
        return invoices[challengeId];
    }
}
