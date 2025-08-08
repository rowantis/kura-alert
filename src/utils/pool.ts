
import {
  PoolInfo,
  DexKey,
  PoolKey,
  DexType
} from './kura-alert/types';
import {
  TOKEN_DECIMALS,
} from './kura-alert/contract';

import { getTokenPrice, getTokenSymbol } from './kura-alert/utils';

export function createPoolKey(tokenA: string, tokenB: string, dex: DexKey): PoolKey {
  const tokenALower = tokenA.toLowerCase();
  const tokenBLower = tokenB.toLowerCase();
  const [token0, token1] = tokenALower < tokenBLower ? [tokenA, tokenB] : [tokenB, tokenA];
  return { token0, token1, dexKey: dex };
}

export function calculatePoolTVL(
  balanceA: bigint,
  balanceB: bigint,
  tokenA: string,
  tokenB: string
): number {
  const decimalsA = TOKEN_DECIMALS[tokenA];
  const decimalsB = TOKEN_DECIMALS[tokenB];
  const priceA = getTokenPrice(tokenA);
  const priceB = getTokenPrice(tokenB);

  if (!decimalsA || !decimalsB || !priceA || !priceB) {
    throw new Error(`Missing token info for ${tokenA} or ${tokenB}`);
  }

  const tvlA = (balanceA * BigInt(Math.floor(priceA * 1e6))) / BigInt(10 ** decimalsA);
  const tvlB = (balanceB * BigInt(Math.floor(priceB * 1e6))) / BigInt(10 ** decimalsB);
  const tvlBig = tvlA + tvlB;

  return Number(tvlBig) / 1e6;
}

export function poolDescription(pool: PoolInfo): string {
  return `${getTokenSymbol(pool.poolKey.token0)}-${getTokenSymbol(pool.poolKey.token1)}-${dexDescription(pool.poolKey.dexKey)}`;
}

export function dexDescription(dexKey: DexKey): string {
  return dexKey.type === DexType.KuraV2
    ? `KuraV2_${dexKey.isStable ? 'Stable' : 'Unstable'}`
    : `KuraV3_${dexKey.tickSpacing}`
}