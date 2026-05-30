// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is IERC721Receiver, Ownable {
    struct Listing {
        uint256 price;
        address seller;
        bool isListed;
    }

    IERC20 public immutable token;
    IERC721 public immutable nft;
    address public feeRecipient;
    uint256 public feePercentage;

    mapping(uint256 => Listing) public listings;

    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTBought(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event FeePercentageUpdated(uint256 newFeePercentage);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    constructor(
        address _tokenAddress,
        address _nftAddress,
        address _feeRecipient,
        uint256 initialFeePercentage
    ) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Marketplace: token is zero");
        require(_nftAddress != address(0), "Marketplace: nft is zero");
        require(_feeRecipient != address(0), "Marketplace: recipient is zero");
        require(initialFeePercentage <= 10000, "Marketplace: fee too high");

        token = IERC20(_tokenAddress);
        nft = IERC721(_nftAddress);
        feeRecipient = _feeRecipient;
        feePercentage = initialFeePercentage;
    }

    function listNFT(uint256 _tokenId, uint256 _price) external {
        require(_price > 0, "Marketplace: price must be positive");
        require(nft.ownerOf(_tokenId) == msg.sender, "Marketplace: not owner");

        nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        listings[_tokenId] = Listing({
            price: _price,
            seller: msg.sender,
            isListed: true
        });

        emit NFTListed(_tokenId, msg.sender, _price);
    }

    function buyNFT(uint256 _tokenId) external {
        Listing memory listing = listings[_tokenId];
        require(listing.isListed, "Marketplace: not listed");
        require(listing.seller != msg.sender, "Marketplace: seller cannot buy");

        uint256 feeAmount = (listing.price * feePercentage) / 10000;
        uint256 sellerAmount = listing.price - feeAmount;

        delete listings[_tokenId];

        if (feeAmount > 0) {
            require(
                token.transferFrom(msg.sender, feeRecipient, feeAmount),
                "Marketplace: fee transfer failed"
            );
        }
        require(
            token.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Marketplace: seller transfer failed"
        );

        nft.safeTransferFrom(address(this), msg.sender, _tokenId);

        emit NFTBought(_tokenId, msg.sender, listing.price);
    }

    function cancelListing(uint256 _tokenId) external {
        Listing memory listing = listings[_tokenId];
        require(listing.isListed, "Marketplace: not listed");
        require(listing.seller == msg.sender, "Marketplace: not seller");

        delete listings[_tokenId];
        nft.safeTransferFrom(address(this), msg.sender, _tokenId);

        emit ListingCancelled(_tokenId, msg.sender);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.isListed, "Marketplace: not listed");
        require(listing.seller == msg.sender, "Marketplace: not seller");
        require(newPrice > 0, "Marketplace: price must be positive");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit PriceUpdated(tokenId, oldPrice, newPrice);
    }

    function getListing(
        uint256 _tokenId
    ) external view returns (uint256 price, address seller, bool isListed) {
        Listing memory listing = listings[_tokenId];
        return (listing.price, listing.seller, listing.isListed);
    }

    function setFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10000, "Marketplace: fee too high");
        feePercentage = _newFeePercentage;
        emit FeePercentageUpdated(_newFeePercentage);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
