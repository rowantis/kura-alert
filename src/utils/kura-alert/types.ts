import { KURA_V3_TICK_SPACING } from "./contract";
export enum DexType {
  KuraV2 = "KuraV2",
  KuraV3 = "KuraV3",
}

export type DexKey = {
  type: DexType.KuraV2;
  isStable: boolean;
} | {
  type: DexType.KuraV3;
  tickSpacing: KURA_V3_TICK_SPACING;
}

export interface PoolKey {
  token0: string;
  token1: string;
  dexKey: DexKey;
}

export interface PoolInfo {
  poolKey: PoolKey;
  poolAddress: string;
  tvl: number;
}

export interface PoolData {
  timestamp: string;
  tvlFilter: number;
  kuraV2Pools: PoolInfo[];
  kuraV3Pools: PoolInfo[];
  summary: {
    totalKuraV2: number;
    totalKuraV3: number;
    totalPools: number;
  };
}