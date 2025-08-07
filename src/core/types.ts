// Event Types
export interface BaseSwapEvent {
  pool: string;
  sender: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
  transactionHash: string;
}

export interface KuraV2SwapEvent extends BaseSwapEvent {
  stable: boolean;
}

export interface KuraV3SwapEvent extends BaseSwapEvent {
  tickSpacing: number;
}

// Configuration Types
export interface Token {
  address: string;
  decimals: number;
  price: number;  // USD 가격 (상수)
}

export interface DexKeyV2 {
  type: 'KuraV2';
  isStable: boolean;
}

export interface DexKeyV3 {
  type: 'KuraV3';
  tickSpacing: number;
}

export type DexKey = DexKeyV2 | DexKeyV3;

export interface PoolKey {
  token0: string;
  token1: string;
  dexKey: DexKey;
}

export interface Pool {
  poolKey: PoolKey;
  poolAddress: string;
  abi: any;  // 컨트랙트 ABI
}