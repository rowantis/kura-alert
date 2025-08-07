import { Pool } from '../core/types';
import IPairABI from '../abis/IPair.json';
import IPairV3ABI from '../abis/IRamsesV3Pool.json';
import initialPools from '../out/initial_pools.json';

export enum KURA_V3_TICK_SPACING {
  V3_1 = 1,
  V3_5 = 5,
  V3_10 = 10,
  V3_50 = 50,
  V3_100 = 100,
  V3_200 = 200,
}

export function getPools(): Pool[] {
  const v2Pools = getV2Pools();
  const v3Pools = getV3Pools();
  return [...v2Pools, ...v3Pools];
}

export function getV2Pools(): Pool[] {
  return initialPools.kuraV2Pools.map(pool => ({
    poolKey: {
      token0: pool.poolKey.token0,
      token1: pool.poolKey.token1,
      dexKey: {
        type: 'KuraV2' as const,
        isStable: pool.poolKey.dexKey.isStable
      }
    },
    poolAddress: pool.poolAddress,
    abi: IPairABI
  }));
}

export function getV3Pools(): Pool[] {
  return initialPools.kuraV3Pools.map(pool => ({
    poolKey: {
      token0: pool.poolKey.token0,
      token1: pool.poolKey.token1,
      dexKey: {
        type: 'KuraV3' as const,
        tickSpacing: pool.poolKey.dexKey.tickSpacing
      }
    },
    poolAddress: pool.poolAddress,
    abi: IPairV3ABI
  }));
}