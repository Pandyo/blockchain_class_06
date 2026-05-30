'use client'

import { useEffect, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { tokenABI, tokenAddress } from '@/app/contracts'
import { ConnectWallet } from '@/components/ConnectWallet'
import { formatTokenAmount } from '@/lib/format'

export function Header() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: mounted && !!address },
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'decimals',
    query: { enabled: mounted },
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'symbol',
    query: { enabled: mounted },
  })

  const { data: claimAmount } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'CLAIM_AMOUNT',
    query: { enabled: mounted },
  })

  const {
    data: hasClaimed,
    refetch: refetchHasClaimed,
    error: claimStatusError,
  } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'hasClaimed',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: mounted && !!address },
  })

  const { writeContract, data: hash, isPending, error: claimError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (!isSuccess) return
    refetchBalance()
    refetchHasClaimed()
  }, [isSuccess, refetchBalance, refetchHasClaimed])

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'
  const canClaim =
    mounted &&
    isConnected &&
    hasClaimed === false &&
    !claimStatusError &&
    !isPending &&
    !isConfirming

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">NFT Marketplace</h1>
          <p className="text-sm text-zinc-500">Sepolia 테스트넷</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!mounted ? (
            <div className="h-10 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ) : (
            <>
              {isConnected && balance !== undefined && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  잔액:{' '}
                  {formatTokenAmount(
                    balance,
                    tokenDecimals,
                    tokenSymbol,
                  )}
                </span>
              )}
              {isConnected && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      writeContract({
                        address: tokenAddress,
                        abi: tokenABI,
                        functionName: 'claimTestTokens',
                      })
                    }
                    disabled={!canClaim}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending || isConfirming ? '토큰 받는 중…' : '테스트 토큰 받기'}
                  </button>
                  {hasClaimed && (
                    <span className="text-xs text-zinc-500">
                      이미 테스트 토큰을 받았습니다
                    </span>
                  )}
                  {hasClaimed === false && claimAmount !== undefined && (
                    <span className="text-xs text-zinc-500">
                      {formatTokenAmount(claimAmount, tokenDecimals, tokenSymbol)} 1회 지급
                    </span>
                  )}
                  {claimStatusError && (
                    <span className="text-xs text-amber-600">
                      새 컨트랙트 배포 후 사용 가능
                    </span>
                  )}
                  {claimError && (
                    <span className="max-w-56 truncate text-xs text-red-500">
                      {claimError.message}
                    </span>
                  )}
                  {isSuccess && (
                    <span className="text-xs text-green-600">
                      테스트 토큰을 받았습니다
                    </span>
                  )}
                </div>
              )}
              <ConnectWallet />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
