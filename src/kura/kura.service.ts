import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DexType, PoolInfo } from "src/utils/kura-alert/types";
import { TOKEN_PRICES } from "src/utils/kura-alert/utils";
import { getTickSpacing, ONE_DAY } from "src/utils/constants";
import axios from 'axios';
import { toChecksumAddress } from "src/utils/kura-alert/address";

interface SubgraphV3Pool {
  id: string;
  token0: {
    decimals: number;
    id: string;
  };
  token1: {
    id: string;
    decimals: number;
  };
  feeTier: number;
}

interface SubgraphV2Pool {
  id: string;
  token0: {
    decimals: number;
    id: string;
  };
  token1: {
    id: string;
    decimals: number;
  };
  isStable: boolean;
}

interface SubgraphResponse {
  data: {
    legacyPools: SubgraphV2Pool[];
    clPools: SubgraphV3Pool[];
  };
}

@Injectable()
export class KuraService {
  private prices: {
    [key: string]: number;
  } = {};

  private pools: PoolInfo[] = [];

  private readonly TOKEN_PRICE_URL = 'https://d2x575fb6ivzxl.cloudfront.net/tokenPrice.json';
  private readonly SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cm9ghm7cnxuaa01x5g6pfchp7/subgraphs/sei/2/gn';

  constructor() {
    this.updatePrices();
    this.updatePools();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updatePrices() {
    try {
      const response = await axios.get(this.TOKEN_PRICE_URL, { timeout: 10000 });
      const { data: tokenPrices } = response.data;

      const normalizedTokenPrices: { [key: string]: number } = {};
      Object.keys(tokenPrices).forEach(key => {
        normalizedTokenPrices[key.toLowerCase()] = tokenPrices[key];
      });

      this.prices = { ...this.prices, ...normalizedTokenPrices };
      console.log(`✅ Updated token prices at ${new Date().toISOString()}`);

    } catch (error) {
      console.warn(`⚠️ Failed to update token prices: ${error.message}`);

      if (Object.keys(this.prices).length === 0) {
        const normalizedTokenPrices: { [key: string]: number } = {};
        Object.keys(TOKEN_PRICES).forEach(key => {
          normalizedTokenPrices[key.toLowerCase()] = TOKEN_PRICES[toChecksumAddress(key)];
        });
        this.prices = { ...normalizedTokenPrices };
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updatePools() {
    try {
      const query = `
        query MyQuery {
          legacyPools {
            id
            token0 {
              decimals
              id
            }
            token1 {
              id
              decimals
            }
            isStable
          }

          clPools {
            id
            token0 {
              decimals
              id
            }
            token1 {
              id
              decimals
            }
            feeTier
          }
        }
      `;

      const response = await axios.post(
        this.SUBGRAPH_URL,
        { query },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const subgraphResponse: SubgraphResponse = response.data;
      const v3Pools: PoolInfo[] = [...subgraphResponse.data.clPools].map(pool => ({
        poolKey: {
          token0: toChecksumAddress(pool.token0.id),
          token1: toChecksumAddress(pool.token1.id),
          dexKey: {
            type: DexType.KuraV3,
            tickSpacing: getTickSpacing(pool.feeTier),
          },
        },
        poolAddress: toChecksumAddress(pool.id),
        tvl: 0,
      }));

      const v2Pools: PoolInfo[] = [...subgraphResponse.data.legacyPools].map(pool => ({
        poolKey: {
          token0: toChecksumAddress(pool.token0.id),
          token1: toChecksumAddress(pool.token1.id),
          dexKey: {
            type: DexType.KuraV2,
            isStable: pool.isStable,
          },
        },
        poolAddress: toChecksumAddress(pool.id),
        tvl: 0,
      }));

      this.pools = [...v3Pools, ...v2Pools];

      console.log(`✅ Updated pools from subgraph: ${this.pools.length} pools at ${new Date().toISOString()}`);

    } catch (error) {
      console.warn(`⚠️ Failed to update pools from subgraph: ${error.message}`);

      // 실패 시 기존 풀 데이터 유지 (첫 실행이 아닌 경우)
      if (this.pools.length === 0) {
        console.log('🔄 No pools data available, will retry on next schedule');
      }
    }
  }



  public getCurrentPrice(tokenAddress: string): number {
    const normalizedAddress = tokenAddress.toLowerCase();
    return this.prices[normalizedAddress] || 0;
  }

  public getPools(): PoolInfo[] {
    return this.pools;
  }

  public getCurrentPeriod(): number {
    const currentTime = Math.floor(Date.now())
    const period = Math.floor(currentTime / (7 * ONE_DAY))
    return period
  }

}