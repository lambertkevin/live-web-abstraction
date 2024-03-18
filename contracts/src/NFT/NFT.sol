// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/token/ERC721/ERC721.sol";

contract QuiVeutEtreMonNFT is ERC721, Ownable {
  uint256 public _lastTokenId = 0;

  constructor(
    address owner
  ) ERC721("QuiVeutEtreMonNFT", "ERIC") Ownable(owner) {}

  function mint() external returns (uint256 tokenId) {
    _safeMint(msg.sender, ++_lastTokenId);
    payable(msg.sender).transfer(0.05 ether);
    return _lastTokenId;
  }

  function tokenURI(
    uint256 tokenId
  ) public pure override returns (string memory) {
    return "ipfs://QmRrL6RVeAty48eajd7whHdwvtt6ZcXYmKT8dNwDAo1Njq";
  }

  receive() external payable {}
}
