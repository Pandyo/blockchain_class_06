# NFT Marketplace

ERC-20 테스트 토큰, ERC-721 NFT, Marketplace 컨트랙트를 함께 사용하는 Sepolia NFT Marketplace 예제입니다.

## 추가 구현 기능

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

## 배포 전 준비

`.env` 또는 `.env.local`에 Sepolia 배포 정보를 설정합니다.

```env
SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
FEE_RECIPIENT=...
INITIAL_FEE_PERCENTAGE=250
```

`INITIAL_FEE_PERCENTAGE`는 basis point 단위입니다. 예를 들어 `250`은 2.5%입니다.

## 컨트랙트 컴파일 및 배포

```bash
npm install
npm run compile
npm run deploy
```

배포 스크립트는 ERC-20, ERC-721, Marketplace 순서로 배포합니다. 배포가 끝나면 출력되는 주소를 `.env.local` 또는 `.env`에 추가합니다.

```env
NEXT_PUBLIC_TOKEN_ADDRESS=...
NEXT_PUBLIC_NFT_ADDRESS=...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=...
```

현재 `app/contracts.ts`에는 기존 Sepolia 주소가 fallback으로 남아 있습니다. 새 기능은 새로 배포한 컨트랙트 주소를 위 환경변수에 설정한 뒤 사용할 수 있습니다.

## 실행 및 검증

```bash
npm run lint
npm run build
npm run dev
```

최종 점검 기준으로 로컬 컴파일, lint, production build는 통과했습니다. 실제 Sepolia 배포는 RPC URL과 private key 환경변수 설정 후 가능합니다.

## 테스트 흐름

1. 지갑 연결
2. Header에서 테스트 토큰 받기
3. 민팅 탭에서 이름, 설명, 이미지, 카테고리 입력 후 NFT 민팅
4. 내 NFT 목록과 NFT 상세 화면에서 카테고리 확인
5. NFT 판매 등록
6. 판매자 계정에서 판매 가격 수정
7. 구매자 계정에서 ERC-20 approve 후 NFT 구매
8. 구매 후 NFT 소유자와 판매 상태 변경 확인
