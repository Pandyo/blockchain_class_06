const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  const initialSupply = hre.ethers.parseUnits('1000000', 18)
  const initialFeePercentage = process.env.INITIAL_FEE_PERCENTAGE
    ? BigInt(process.env.INITIAL_FEE_PERCENTAGE)
    : 250n
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address

  console.log('Deploying with account:', deployer.address)

  const TestToken = await hre.ethers.getContractFactory('TestToken')
  const token = await TestToken.deploy(initialSupply)
  await token.waitForDeployment()
  const tokenAddress = await token.getAddress()
  console.log('TestToken:', tokenAddress)

  const CategoryNFT = await hre.ethers.getContractFactory('CategoryNFT')
  const nft = await CategoryNFT.deploy()
  await nft.waitForDeployment()
  const nftAddress = await nft.getAddress()
  console.log('CategoryNFT:', nftAddress)

  const NFTMarketplace = await hre.ethers.getContractFactory('NFTMarketplace')
  const marketplace = await NFTMarketplace.deploy(
    tokenAddress,
    nftAddress,
    feeRecipient,
    initialFeePercentage,
  )
  await marketplace.waitForDeployment()
  const marketplaceAddress = await marketplace.getAddress()
  console.log('NFTMarketplace:', marketplaceAddress)

  console.log('\nAdd these values to .env.local or .env:')
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}`)
  console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`)
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
