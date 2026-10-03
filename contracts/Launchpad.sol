// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./QDOTToken.sol";

/**
 * @title Launchpad
 * @notice Polkadot Launchpad managing token sales, vesting allocations, and treasury splits.
 */
contract Launchpad {
    struct Campaign {
        address token;
        address creator;
        uint256 tokenPriceInDot; // Price in native DOT wei per base token unit
        uint256 tokensForSale;
        uint256 tokensSold;
        uint256 totalDotRaised;
        uint256 startTime;
        uint256 endTime;
        uint256 vestingDuration; // Vesting lock period in seconds
        bool finalized;
    }

    struct InvestorAllocation {
        uint256 purchasedTokens;
        uint256 claimedTokens;
        uint256 purchaseTime;
    }

    address public treasury;
    uint256 public treasuryFeeBps = 250; // 2.5% protocol fee
    uint256 public nextCampaignId = 1;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => InvestorAllocation)) public allocations;

    event CampaignCreated(uint256 indexed campaignId, address indexed token, address creator, uint256 tokensForSale, uint256 tokenPriceInDot);
    event TokensPurchased(uint256 indexed campaignId, address indexed buyer, uint256 amountPaidDot, uint256 tokensReceived);
    event TokensClaimed(uint256 indexed campaignId, address indexed claimer, uint256 amountClaimed);
    event CampaignFinalized(uint256 indexed campaignId, uint256 totalRaisedDot, uint256 feePaidDot);

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function createCampaign(
        address token,
        uint256 tokenPriceInDot,
        uint256 tokensForSale,
        uint256 durationSeconds,
        uint256 vestingDurationSeconds
    ) external returns (uint256) {
        require(token != address(0), "Invalid token");
        require(tokensForSale > 0, "No tokens for sale");
        require(tokenPriceInDot > 0, "Invalid price");

        // Transfer tokens into Launchpad escrow
        require(QDOTToken(token).transferFrom(msg.sender, address(this), tokensForSale), "Deposit escrow failed");

        uint256 campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            token: token,
            creator: msg.sender,
            tokenPriceInDot: tokenPriceInDot,
            tokensForSale: tokensForSale,
            tokensSold: 0,
            totalDotRaised: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            vestingDuration: vestingDurationSeconds,
            finalized: false
        });

        emit CampaignCreated(campaignId, token, msg.sender, tokensForSale, tokenPriceInDot);
        return campaignId;
    }

    function buyTokens(uint256 campaignId) external payable {
        Campaign storage camp = campaigns[campaignId];
        require(block.timestamp >= camp.startTime, "Campaign not started");
        require(block.timestamp <= camp.endTime, "Campaign ended");
        require(!camp.finalized, "Campaign finalized");
        require(msg.value > 0, "Zero payment");

        uint256 tokenAmount = (msg.value * 1e18) / camp.tokenPriceInDot;
        require(camp.tokensSold + tokenAmount <= camp.tokensForSale, "Exceeds available tokens");

        camp.tokensSold += tokenAmount;
        camp.totalDotRaised += msg.value;

        InvestorAllocation storage alloc = allocations[campaignId][msg.sender];
        alloc.purchasedTokens += tokenAmount;
        alloc.purchaseTime = block.timestamp;

        emit TokensPurchased(campaignId, msg.sender, msg.value, tokenAmount);
    }

    function claimTokens(uint256 campaignId) external {
        Campaign storage camp = campaigns[campaignId];
        InvestorAllocation storage alloc = allocations[campaignId][msg.sender];
        require(alloc.purchasedTokens > alloc.claimedTokens, "No claimable tokens");

        if (camp.vestingDuration > 0) {
            uint256 unlockTime = camp.endTime + camp.vestingDuration;
            require(block.timestamp >= unlockTime, "Tokens still vested");
        }

        uint256 claimable = alloc.purchasedTokens - alloc.claimedTokens;
        alloc.claimedTokens = alloc.purchasedTokens;

        require(QDOTToken(camp.token).transfer(msg.sender, claimable), "Transfer failed");
        emit TokensClaimed(campaignId, msg.sender, claimable);
    }

    function finalizeCampaign(uint256 campaignId) external {
        Campaign storage camp = campaigns[campaignId];
        require(msg.sender == camp.creator || msg.sender == treasury, "Unauthorized");
        require(block.timestamp > camp.endTime || camp.tokensSold == camp.tokensForSale, "Cannot finalize yet");
        require(!camp.finalized, "Already finalized");

        camp.finalized = true;

        uint256 fee = (camp.totalDotRaised * treasuryFeeBps) / 10000;
        uint256 proceeds = camp.totalDotRaised - fee;

        if (fee > 0) {
            (bool successFee, ) = treasury.call{value: fee}("");
            require(successFee, "Treasury transfer failed");
        }

        if (proceeds > 0) {
            (bool successProceeds, ) = camp.creator.call{value: proceeds}("");
            require(successProceeds, "Creator payout failed");
        }

        // Return unsold tokens if any
        if (camp.tokensSold < camp.tokensForSale) {
            uint256 unsold = camp.tokensForSale - camp.tokensSold;
            require(QDOTToken(camp.token).transfer(camp.creator, unsold), "Return unsold failed");
        }

        emit CampaignFinalized(campaignId, camp.totalDotRaised, fee);
    }
}
