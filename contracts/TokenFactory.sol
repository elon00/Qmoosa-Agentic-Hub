// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./QDOTToken.sol";

/**
 * @title TokenFactory
 * @notice Permissionless factory enabling users and AI agents to deploy tokens on Polkadot Hub.
 */
contract TokenFactory {
    struct TokenInfo {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint8 decimals;
        uint256 initialSupply;
        bool flexibleSupply;
        uint256 createdAt;
    }

    TokenInfo[] public deployedTokens;
    mapping(address => address[]) public tokensByCreator;

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        bool flexibleSupply
    );

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        bool flexibleSupply
    ) external returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");

        QDOTToken newToken = new QDOTToken(
            name,
            symbol,
            decimals,
            initialSupply,
            msg.sender
        );

        address tokenAddr = address(newToken);

        TokenInfo memory info = TokenInfo({
            tokenAddress: tokenAddr,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            decimals: decimals,
            initialSupply: initialSupply,
            flexibleSupply: flexibleSupply,
            createdAt: block.timestamp
        });

        deployedTokens.push(info);
        tokensByCreator[msg.sender].push(tokenAddr);

        emit TokenCreated(tokenAddr, msg.sender, name, symbol, initialSupply, flexibleSupply);
        return tokenAddr;
    }

    function totalTokensDeployed() external view returns (uint256) {
        return deployedTokens.length;
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
}
