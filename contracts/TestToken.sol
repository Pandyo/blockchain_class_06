// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    mapping(address => bool) public hasClaimed;

    uint256 public constant CLAIM_AMOUNT = 100 * 10 ** 18;

    event TestTokensClaimed(address indexed user, uint256 amount);

    constructor(uint256 initialSupply) ERC20("Test Token", "TEST") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function claimTestTokens() external {
        require(!hasClaimed[msg.sender], "TestToken: already claimed");

        hasClaimed[msg.sender] = true;
        _mint(msg.sender, CLAIM_AMOUNT);

        emit TestTokensClaimed(msg.sender, CLAIM_AMOUNT);
    }
}
