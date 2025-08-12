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
  token0: ChecksumAddress;
  token1: ChecksumAddress;
  dexKey: DexKey;
}

export interface PoolInfo {
  poolKey: PoolKey;
  poolAddress: ChecksumAddress;
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

// Checksum address를 강제하는 브랜드 타입
export type ChecksumAddress = string & { readonly __brand: 'ChecksumAddress' };

// 기존 Address 타입을 ChecksumAddress로 변경
export type Address = ChecksumAddress;