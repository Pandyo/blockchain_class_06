// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CategoryNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _categories;

    event NFTCategorySet(uint256 indexed tokenId, string category);

    constructor() ERC721("Category NFT", "CNFT") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri) public returns (uint256) {
        return safeMintWithCategory(to, uri, "Uncategorized");
    }

    function safeMintWithCategory(
        address to,
        string memory uri,
        string memory category
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _categories[tokenId] = bytes(category).length == 0 ? "Uncategorized" : category;

        emit NFTCategorySet(tokenId, _categories[tokenId]);

        return tokenId;
    }

    function categoryOf(uint256 tokenId) public view returns (string memory) {
        ownerOf(tokenId);
        return _categories[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
}
