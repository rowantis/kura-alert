import { ethers } from 'ethers';
import { TOKEN_DECIMALS } from './contract';
import { ChecksumAddress, DexType, PoolInfo } from './types';
import IPairAbi from './abis/IPair.json';
import IRamsesV3PoolAbi from './abis/IRamsesV3Pool.json';
import { toChecksumAddress } from './address';

export interface SwapEvent {
  pool: PoolInfo;
  tokenIn: ChecksumAddress;
  tokenOut: ChecksumAddress;
  amountIn: string;
  amountOut: string;
  blockNumber: number;
  transactionHash: string;
}

export interface AddLiquidityEvent {
  pool: PoolInfo;
  token0: ChecksumAddress;
  token1: ChecksumAddress;
  amount0: string;
  amount1: string;
  blockNumber: number;
  transactionHash: string;
}

export interface RemoveLiquidityEvent {
  pool: PoolInfo;
  token0: ChecksumAddress;
  token1: ChecksumAddress;
  amount0: string;
  amount1: string;
  blockNumber: number;
  transactionHash: string;
}

export const ABI_FOR_DEX_TYPE = {
  [DexType.KuraV2]: IPairAbi,
  [DexType.KuraV3]: IRamsesV3PoolAbi,
};

export function parseSwapEvent(event: any, pool: PoolInfo): SwapEvent | null {
  try {
    switch (pool.poolKey.dexKey.type) {
      case DexType.KuraV2:
        return parseKuraV2Swap(event, pool);
      case DexType.KuraV3:
        return parseKuraV3Swap(event, pool);
    }
  } catch (error) {
    console.log(`❌ Failed to parse swap event: ${error.message}`);
    return null;
  }
}


export function parseAddLiquidityEvent(event: any, pool: PoolInfo): AddLiquidityEvent | null {
  try {
    switch (pool.poolKey.dexKey.type) {
      case DexType.KuraV2:
        return parseKuraAddLiquidityEvent(event, pool);
      case DexType.KuraV3:
        return parseKuraAddLiquidityEvent(event, pool);
      default:
        return null;
    }
  } catch (error) {
    console.log(`❌ Failed to parse swap event: ${error.message}`);
    return null;
  }
}

export function parseRemoveLiquidityEvent(event: any, pool: PoolInfo): RemoveLiquidityEvent | null {
  try {
    switch (pool.poolKey.dexKey.type) {
      case DexType.KuraV2:
        return parseKuraRemoveLiquidityEvent(event, pool);
      case DexType.KuraV3:
        return parseKuraRemoveLiquidityEvent(event, pool);
      default:
        return null;
    }
  } catch (error) {
    console.log(`❌ Failed to parse swap event: ${error.message}`);
    return null;
  }
}

function parseKuraV2Swap(event: any, pool: PoolInfo): SwapEvent | null {
  try {
    const abi = ABI_FOR_DEX_TYPE[pool.poolKey.dexKey.type];
    const iface = new ethers.Interface(abi);
    const parsedLog = iface.parseLog(event);

    if (parsedLog && parsedLog.name === 'Swap') {
      const { amount0In, amount1In, amount0Out, amount1Out } = parsedLog.args;
      let amountIn: string;
      let amountOut: string;
      let tokenIn: ChecksumAddress;
      let tokenOut: ChecksumAddress;

      if (BigInt(amount0In) > BigInt(0) && BigInt(amount1In) === BigInt(0)) {
        const amountInRaw = BigInt(amount0In);
        const amountOutRaw = BigInt(amount1Out);
        tokenIn = pool.poolKey.token0;
        tokenOut = pool.poolKey.token1;
        amountIn = ethers.formatUnits(amountInRaw, TOKEN_DECIMALS[tokenIn] || 18);
        amountOut = ethers.formatUnits(amountOutRaw, TOKEN_DECIMALS[tokenOut] || 18);
      } else if (BigInt(amount1In) > BigInt(0) && BigInt(amount0In) === BigInt(0)) {
        // token1 -> token0
        const amountInRaw = BigInt(amount1In);
        const amountOutRaw = BigInt(amount0Out);
        tokenIn = pool.poolKey.token1;
        tokenOut = pool.poolKey.token0;
        amountIn = ethers.formatUnits(amountInRaw, TOKEN_DECIMALS[tokenIn] || 18);
        amountOut = ethers.formatUnits(amountOutRaw, TOKEN_DECIMALS[tokenOut] || 18);
      } else {
        console.warn("unreachable code");
        return null;
      }

      return {
        pool,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        blockNumber: parseInt(event.blockNumber, 16),
        transactionHash: event.transactionHash,
      };
    }
  } catch (error) {
    console.log(`❌ KuraV2 ABI parsing failed: ${error.message}`);
  }
  return null;
}

function parseKuraV3Swap(event: any, pool: PoolInfo): SwapEvent | null {
  try {
    const abi = ABI_FOR_DEX_TYPE[pool.poolKey.dexKey.type];
    const iface = new ethers.Interface(abi);
    const parsedLog = iface.parseLog(event);

    if (parsedLog && parsedLog.name === 'Swap') {
      const { amount0, amount1 } = parsedLog.args;

      let amountIn: string;
      let amountOut: string;
      let tokenIn: ChecksumAddress;
      let tokenOut: ChecksumAddress;

      if (BigInt(amount0) > BigInt(0)) {
        // token0 -> token1
        const amountInRaw = BigInt(amount0);
        const amountOutRaw = BigInt(-amount1);
        tokenIn = pool.poolKey.token0;
        tokenOut = pool.poolKey.token1;
        amountIn = ethers.formatUnits(amountInRaw, TOKEN_DECIMALS[tokenIn] || 18);
        amountOut = ethers.formatUnits(amountOutRaw, TOKEN_DECIMALS[tokenOut] || 18);
      } else if (BigInt(amount1) > BigInt(0)) {
        // token1 -> token0
        const amountInRaw = BigInt(amount1);
        const amountOutRaw = BigInt(-amount0);
        tokenIn = pool.poolKey.token1;
        tokenOut = pool.poolKey.token0;
        amountIn = ethers.formatUnits(amountInRaw, TOKEN_DECIMALS[tokenIn] || 18);
        amountOut = ethers.formatUnits(amountOutRaw, TOKEN_DECIMALS[tokenOut] || 18);
      } else {
        console.warn("unreachable code");
        return null;
      }

      return {
        pool,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        blockNumber: parseInt(event.blockNumber, 16),
        transactionHash: event.transactionHash,
      };
    }
  } catch (error) {
    console.log(`❌ KuraV3 ABI parsing failed: ${error.message}`);
  }
  return null;
}

function parseKuraAddLiquidityEvent(event: any, pool: PoolInfo): AddLiquidityEvent | null {
  try {
    const abi = ABI_FOR_DEX_TYPE[pool.poolKey.dexKey.type];
    const iface = new ethers.Interface(abi);
    const parsedLog = iface.parseLog(event);

    if (parsedLog && parsedLog.name === 'Mint') {
      const { amount0, amount1 } = parsedLog.args;

      return {
        pool,
        token0: pool.poolKey.token0,
        token1: pool.poolKey.token1,
        amount0: ethers.formatUnits(amount0, TOKEN_DECIMALS[pool.poolKey.token0] || 18),
        amount1: ethers.formatUnits(amount1, TOKEN_DECIMALS[pool.poolKey.token1] || 18),
        blockNumber: parseInt(event.blockNumber, 16),
        transactionHash: event.transactionHash,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log(`❌ Kura ABI parsing failed: ${error.message}`);
  }
  return null;
}

function parseKuraRemoveLiquidityEvent(event: any, pool: PoolInfo): RemoveLiquidityEvent | null {
  try {
    const abi = ABI_FOR_DEX_TYPE[pool.poolKey.dexKey.type];
    const iface = new ethers.Interface(abi);
    const parsedLog = iface.parseLog(event);

    if (parsedLog && parsedLog.name === 'Burn') {

      const { amount0, amount1 } = parsedLog.args;

      return {
        pool,
        token0: pool.poolKey.token0,
        token1: pool.poolKey.token1,
        amount0: ethers.formatUnits(amount0, TOKEN_DECIMALS[pool.poolKey.token0] || 18),
        amount1: ethers.formatUnits(amount1, TOKEN_DECIMALS[pool.poolKey.token1] || 18),
        blockNumber: parseInt(event.blockNumber, 16),
        transactionHash: event.transactionHash,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log(`❌ Kura ABI parsing failed: ${error.message}`);
  }
  return null;
}