'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { parseUnits } from 'viem'
import {
  marketplaceABI,
  marketplaceAddress,
  nftABI,
  nftAddress,
  tokenABI,
  tokenAddress,
} from '@/app/contracts'
import { useNftMetadata } from '@/hooks/useNftMetadata'
import { formatTokenAmount, shortenAddress } from '@/lib/format'
import { Header } from '@/components/Header'
import { BuyNftButton } from '@/components/nft/BuyNftButton'
import { ListNftForm } from '@/components/nft/ListNftForm'
import { CancelListingButton } from '@/components/nft/CancelListingButton'

type NftDetailViewProps = {
  tokenId: bigint
  from?: string
}

export function NftDetailView({ tokenId, from }: NftDetailViewProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [priceInput, setPriceInput] = useState('')
  const [priceError, setPriceError] = useState('')

  const { data: tokenUri } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'tokenURI',
    args: [tokenId],
  })

  const { data: owner } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'ownerOf',
    args: [tokenId],
  })

  const { data: listing, refetch: refetchListing } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceABI,
    functionName: 'getListing',
    args: [tokenId],
  })

  const { data: category } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'categoryOf',
    args: [tokenId],
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'decimals',
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'symbol',
  })

  const { metadata, imageUrl, loading } = useNftMetadata(tokenUri)

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'

  const isListed = listing?.[2] ?? false
  const listPrice = listing?.[0]
  const seller = listing?.[1]

  const isOwner =
    address &&
    owner &&
    owner.toLowerCase() === address.toLowerCase()

  const isSeller =
    address &&
    seller &&
    isListed &&
    seller.toLowerCase() === address.toLowerCase()

  const backHref =
    from === 'my' ? '/?tab=my' : from === 'mint' ? '/?tab=mint' : '/?tab=market'

  const handleSuccess = () => {
    refetchListing()
    router.refresh()
  }

  const {
    writeContract: writePrice,
    data: priceHash,
    isPending: isPricePending,
    error: updatePriceError,
    reset: resetPrice,
  } = useWriteContract()
  const { isLoading: isPriceConfirming, isSuccess: isPriceUpdated } =
    useWaitForTransactionReceipt({
      hash: priceHash,
    })

  useEffect(() => {
    if (!isPriceUpdated) return
    refetchListing()
    router.refresh()
    setPriceInput('')
    setPriceError('')
    const timer = setTimeout(() => resetPrice(), 2500)
    return () => clearTimeout(timer)
  }, [isPriceUpdated, refetchListing, resetPrice, router])

  const updatePrice = () => {
    setPriceError('')
    if (!priceInput) return

    let newPrice: bigint
    try {
      newPrice = parseUnits(priceInput, tokenDecimals)
    } catch {
      setPriceError('올바른 가격을 입력하세요.')
      return
    }

    if (newPrice <= BigInt(0)) {
      setPriceError('가격은 0보다 커야 합니다.')
      return
    }

    writePrice({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'updatePrice',
      args: [tokenId, newPrice],
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          ← 목록으로
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            {loading ? (
              <div className="flex aspect-square items-center justify-center text-zinc-500">
                로딩 중…
              </div>
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={metadata?.name ?? `NFT #${tokenId}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-zinc-500">
                이미지 없음
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {metadata?.name ?? `NFT #${tokenId.toString()}`}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Token ID: {tokenId.toString()}
              </p>
            </div>

            {metadata?.description && (
              <p className="text-zinc-600 dark:text-zinc-400">
                {metadata.description}
              </p>
            )}

            <dl className="space-y-2 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">소유자</dt>
                <dd className="font-mono">
                  {owner ? shortenAddress(owner, 6) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">판매 상태</dt>
                <dd>{isListed ? '판매 중' : '미등록'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">카테고리</dt>
                <dd>{typeof category === 'string' && category ? category : '—'}</dd>
              </div>
              {isListed && listPrice !== undefined && listPrice > BigInt(0) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">가격</dt>
                  <dd className="font-medium text-violet-600 dark:text-violet-400">
                    {formatTokenAmount(listPrice, tokenDecimals, tokenSymbol)}
                  </dd>
                </div>
              )}
              {isListed && seller && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">판매자</dt>
                  <dd className="font-mono">{shortenAddress(seller, 6)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              {isListed && !isSeller && (
                <BuyNftButton
                  tokenId={tokenId}
                  price={listPrice!}
                  seller={seller!}
                  address={address}
                  isConnected={isConnected}
                  onSuccess={handleSuccess}
                />
              )}

              {isSeller && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <h2 className="mb-3 text-sm font-semibold">판매 가격 수정</h2>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="새 판매 가격 (토큰)"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={updatePrice}
                        disabled={isPricePending || isPriceConfirming || !priceInput}
                        className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                      >
                        {isPricePending || isPriceConfirming
                          ? '가격 수정 중…'
                          : '가격 수정'}
                      </button>
                      {priceError && (
                        <p className="text-sm text-red-500">{priceError}</p>
                      )}
                      {updatePriceError && (
                        <p className="text-sm text-red-500">
                          {updatePriceError.message.slice(0, 160)}
                        </p>
                      )}
                      {isPriceUpdated && (
                        <p className="text-sm text-green-600">
                          판매 가격이 수정되었습니다.
                        </p>
                      )}
                    </div>
                  </div>
                  <CancelListingButton
                    tokenId={tokenId}
                    onSuccess={handleSuccess}
                  />
                </div>
              )}

              {isOwner && !isListed && (
                <ListNftForm
                  tokenId={tokenId}
                  tokenDecimals={tokenDecimals}
                  address={address}
                  onSuccess={handleSuccess}
                />
              )}

              {isListed && !isSeller && !isConnected && (
                <p className="text-sm text-zinc-500">
                  지갑을 연결하면 구매할 수 있습니다.
                </p>
              )}

              {!isListed && !isOwner && isConnected && (
                <p className="text-sm text-zinc-500">
                  이 NFT는 현재 판매되지 않습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
