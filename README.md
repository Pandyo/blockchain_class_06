# NFT Marketplace 추가 구현 기능

- ERC-20 `TestToken`
  - `claimTestTokens()`로 연결된 지갑이 테스트 토큰을 1회 받을 수 있습니다.
  - `hasClaimed(address)`로 주소별 수령 여부를 조회합니다.
  - 지급량은 `CLAIM_AMOUNT = 100 * 10 ** 18`입니다.
- ERC-721 `CategoryNFT`
  - 기존 `safeMint(address,string)`는 유지합니다.
  - `safeMintWithCategory(address,string,string)`로 NFT 민팅 시 카테고리를 함께 저장합니다.
  - `categoryOf(uint256)`로 tokenId별 카테고리를 조회합니다.
- Marketplace `NFTMarketplace`
  - 기존 판매 등록, 구매, 판매 취소 기능을 유지합니다.
  - `updatePrice(uint256,uint256)`로 판매자 본인이 판매 중인 NFT 가격을 수정할 수 있습니다.
