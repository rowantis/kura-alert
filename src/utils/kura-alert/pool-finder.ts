import { ethers } from 'ethers';
import { PoolInfo, PoolData, DexType, ChecksumAddress } from './types';
import {
  KURA_V2_FACTORY,
  KURA_V3_FACTORY,
  TOKENS,
  PATHS,
  KURA_V3_TICK_SPACING,
} from './contract';
import {
  getTokenSymbol,
} from './utils';
import { delay } from '../utils';
import {
  createPoolKey,
  calculatePoolTVL,
} from '../pool';

import ERC20ABI from './abis/ERC20.json';
import IKuraV2FactoryABI from './abis/IPairFactory.json';
import IKuraV3FactoryABI from './abis/IRamsesV3Factory.json';
import { toChecksumAddress } from './address';

export class PoolFinder {
  private provider: ethers.Provider;
  private kuraV2Factory: ethers.Contract;
  private kuraV3Factory: ethers.Contract;

  constructor(rpcUrl: string) {
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.kuraV2Factory = new ethers.Contract(KURA_V2_FACTORY, IKuraV2FactoryABI, this.provider);
    this.kuraV3Factory = new ethers.Contract(KURA_V3_FACTORY, IKuraV3FactoryABI, this.provider);
  }
  async checkKuraV2Pool(
    tokenA: ChecksumAddress,
    tokenB: ChecksumAddress,
    stable: boolean,
    tvlFilter: number
  ): Promise<PoolInfo | null> {
    console.log(`Checking KuraV2 pool ${getTokenSymbol(tokenA)}-${getTokenSymbol(tokenB)}...`);
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pair = await this.kuraV2Factory.getPair(tokenA, tokenB, stable);
        await delay(1000);
        if (pair === ethers.ZeroAddress) return null;
        console.log("pair address found ", pair);

        const tokenAContract = new ethers.Contract(tokenA, ERC20ABI, this.provider);
        const tokenBContract = new ethers.Contract(tokenB, ERC20ABI, this.provider);

        const balanceA = await tokenAContract.balanceOf(pair);
        await delay(1000);
        const balanceB = await tokenBContract.balanceOf(pair);
        await delay(1000);

        const tvl = calculatePoolTVL(balanceA, balanceB, tokenA, tokenB);
        console.log("tvl: ", tvl, "balanceA: ", balanceA, "balanceB: ", balanceB);
        if (tvlFilter > 0 && tvl < tvlFilter) {
          return null;
        };
        console.log("add pool ", pair);

        return {
          poolKey: createPoolKey(toChecksumAddress(tokenA), toChecksumAddress(tokenB), { type: DexType.KuraV2, isStable: stable }),
          poolAddress: pair,
          tvl: tvl,
        };
      } catch (error) {
        console.log(`Error checking V1 pool ${tokenA}-${tokenB} - Attempt ${attempt}/${maxRetries}:`, error.message);

        if (attempt === maxRetries) {
          console.log(`Failed to check V1 pool ${tokenA}-${tokenB} after ${maxRetries} attempts`);
          return null;
        }

        await delay(1000); // 재시도 전 1초 대기
      }
    }

    return null;
  }

  async checkKuraV3Pool(
    tokenA: ChecksumAddress,
    tokenB: ChecksumAddress,
    tickSpacing: KURA_V3_TICK_SPACING,
    tvlFilter: number
  ): Promise<PoolInfo | null> {
    console.log(`Checking KuraV3 pool ${getTokenSymbol(tokenA)}-${getTokenSymbol(tokenB)}-${tickSpacing}...`);
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pool = await this.kuraV3Factory.getPool(tokenA, tokenB, tickSpacing);
        await delay(1000);
        if (pool === ethers.ZeroAddress) return null;
        console.log("pool address found ", pool);
        const tokenAContract = new ethers.Contract(tokenA, ERC20ABI, this.provider);
        const tokenBContract = new ethers.Contract(tokenB, ERC20ABI, this.provider);

        const balanceA = await tokenAContract.balanceOf(pool);
        await delay(1000);
        const balanceB = await tokenBContract.balanceOf(pool);
        await delay(1000);

        const tvl = calculatePoolTVL(balanceA, balanceB, tokenA, tokenB);
        console.log("tvl: ", tvl, "balanceA: ", balanceA, "balanceB: ", balanceB);
        if (tvlFilter > 0 && tvl < tvlFilter) {
          return null;
        };
        console.log("add pool ", pool);
        return {
          poolKey: createPoolKey(toChecksumAddress(tokenA), toChecksumAddress(tokenB), { type: DexType.KuraV3, tickSpacing }),
          poolAddress: pool,
          tvl: tvl,
        };
      } catch (error) {
        console.log(`Error checking KuraV3 pool ${tokenA}-${tokenB} (${tickSpacing}) - Attempt ${attempt}/${maxRetries}:`, error.message);

        if (attempt === maxRetries) {
          console.log(`Failed to check KuraV3 pool ${tokenA}-${tokenB} (${tickSpacing}) after ${maxRetries} attempts`);
          return null;
        }

        await delay(1000); // 재시도 전 1초 대기
      }
    }

    return null;
  }

  async generateKuraV2Pools(tvlFilter: number): Promise<PoolInfo[]> {
    console.log('🔍 Finding valid kuraV2 pools...');
    const validPools: PoolInfo[] = [];

    for (const stable of [true, false]) {
      for (let i = 0; i < TOKENS.length - 1; i++) {
        for (let j = i + 1; j < TOKENS.length; j++) {
          const pool = await this.checkKuraV2Pool(TOKENS[i], TOKENS[j], stable, tvlFilter);
          if (pool) {
            validPools.push(pool);
            const symbol0 = getTokenSymbol(pool.poolKey.token0);
            const symbol1 = getTokenSymbol(pool.poolKey.token1);
            console.log(
              `${symbol0}\t${symbol1}\t${pool.poolKey.dexKey.type}_${stable ? 'Stable' : 'Unstable'}\t${pool.tvl.toFixed(0)}`
            );
          }
        }
      }
    }

    return validPools;
  }


  async generateKuraV3Pools(tvlFilter: number): Promise<PoolInfo[]> {
    console.log('🔍 Finding valid kuraV3 pools...');
    const validPools: PoolInfo[] = [];

    for (let i = 0; i < TOKENS.length - 1; i++) {
      for (let j = i + 1; j < TOKENS.length; j++) {
        for (const tickSpacing of [KURA_V3_TICK_SPACING.V3_1, KURA_V3_TICK_SPACING.V3_5, KURA_V3_TICK_SPACING.V3_10, KURA_V3_TICK_SPACING.V3_50, KURA_V3_TICK_SPACING.V3_100]) {
          const pool = await this.checkKuraV3Pool(TOKENS[i], TOKENS[j], tickSpacing, tvlFilter);
          if (pool) {
            validPools.push(pool);
            const symbol0 = getTokenSymbol(pool.poolKey.token0);
            const symbol1 = getTokenSymbol(pool.poolKey.token1);
            console.log(
              `${symbol0}\t${symbol1}\t${pool.poolKey.dexKey.type}_${pool.poolKey.dexKey.type === 'KuraV3' ? `${pool.poolKey.dexKey.tickSpacing}` : ''}\t${pool.tvl.toFixed(0)}`
            );
          }
        }
      }
    }

    return validPools;
  }

  async generateAllKuraPools(tvlFilter: number = 10): Promise<{ v2: PoolInfo[], v3: PoolInfo[] }> {
    const kuraV2Pools = await this.generateKuraV2Pools(tvlFilter);
    const kuraV3Pools = await this.generateKuraV3Pools(tvlFilter);

    console.log(`\n✅ Found ${kuraV2Pools.length} V2 pools and ${kuraV3Pools.length} V3 pools with sufficient TVL from Kura`);

    return { v2: kuraV2Pools, v3: kuraV3Pools };
  }
  /**
   * 풀 정보를 JSON으로 저장
   */
  async savePoolsToFile(kuraPools: { v2: PoolInfo[], v3: PoolInfo[] }, filename: string = PATHS.VALID_POOLS) {
    const fs = require('fs');
    const path = require('path');

    // dist 폴더가 없으면 생성
    const outDir = path.dirname(filename);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const data: PoolData = {
      timestamp: new Date().toISOString(),
      tvlFilter: 10,
      kuraV2Pools: kuraPools.v2,
      kuraV3Pools: kuraPools.v3,
      summary: {
        totalKuraV2: kuraPools.v2.length,
        totalKuraV3: kuraPools.v3.length,
        totalPools: kuraPools.v2.length + kuraPools.v3.length,
      }
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Pools saved to ${filename} `);
  }

  async loadPoolsFromFile(filename: string = PATHS.VALID_POOLS): Promise<{
    kura: { v2: PoolInfo[], v3: PoolInfo[] }
  }> {
    const fs = require('fs');

    if (!fs.existsSync(filename)) {
      throw new Error(`Pool file not found: ${filename} `);
    }

    const data: PoolData = JSON.parse(fs.readFileSync(filename, 'utf8'));

    return {
      kura: {
        v2: data.kuraV2Pools,
        v3: data.kuraV3Pools
      }
    };
  }
} 