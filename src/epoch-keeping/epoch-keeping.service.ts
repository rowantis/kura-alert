import { Injectable } from "@nestjs/common";
import { KURA_SWAP_ROUTER, PATHS, TOKEN_DECIMALS } from "src/utils/kura-alert/contract";
import fs from "fs";
import { DexType, PoolInfo, ChecksumAddress } from "src/utils/kura-alert/types";
import { call, sendTransaction } from "../utils/blockchain";
import { ethers, formatUnits, parseUnits } from "ethers";
import { KuraService } from "src/kura/kura.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { getAvailableOrderIndex, MAX_SQRT_RATIO_MINUS_ONE, MIN_SQRT_RATIO_PLUS_ONE, WHITELISTED_TOKENS } from "src/utils/constants";
import BigNumber from "bignumber.js";
import { toChecksumAddress, toChecksumAddresses } from "src/utils/kura-alert/address";
import { SlackService } from "src/slack/slack.service";
import { SlackChannel } from "src/utils/enums";
import { poolDescription } from "src/utils/pool";
import { getTokenSymbol } from "src/utils/kura-alert/utils";

const KURA_SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, int24 tickSpacing, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const TARGET_VALUE = 0.0005;

@Injectable()
export class EpochKeepingService {
  private privateKey: string;
  private rpcUrl: string;
  private publicKey: string;
  private isUpdating: boolean = false;
  private isInitialized: boolean = false;
  private messageMap: {
    [message: string]: boolean;
  } = {};

  private lastUpdatedPeriod: {
    [poolAddress: string]: number;
  } = {};

  constructor(
    private readonly slackService: SlackService,
    private readonly kura: KuraService,
  ) {
    if (!process.env.EPOCH_KEEPER_PRIVATE_KEY) {
      throw new Error("EPOCH_KEEPER_PRIVATE_KEY is not set");
    }
    if (!process.env.RPC_URL) {
      throw new Error("RPC_URL is not set");
    }
    this.privateKey = process.env.EPOCH_KEEPER_PRIVATE_KEY;
    this.rpcUrl = process.env.RPC_URL;

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);

    const wallet = new ethers.Wallet(this.privateKey, provider);
    this.publicKey = wallet.address;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.lastUpdatedPeriod = JSON.parse(fs.readFileSync(PATHS.LAST_UPDATED_PERIOD, 'utf8'));
    console.log('🔄 Loaded last updated period');

    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping event monitor...');
      await this.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Stopping event monitor...');
      await this.destroy();
      process.exit(0);
    });

    await this.roughSwap(
      {
        poolAddress: toChecksumAddress("0x6a824f9b8035eb132539865b9158c84d57d0697e"),
        poolKey: {
          token0: toChecksumAddress("0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392"),
          token1: toChecksumAddress("0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7"),
          dexKey: {
            type: DexType.KuraV3,
            tickSpacing: 200,
          },
        },
        tvl: 0,
      },
      toChecksumAddress("0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7"),
      toChecksumAddress("0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392"),
      parseUnits("0.08", 6).toString()
    )
  }

  async destroy() {
    if (!this.isInitialized) return;
    this.isInitialized = false;
    fs.writeFileSync(PATHS.LAST_UPDATED_PERIOD, JSON.stringify(this.lastUpdatedPeriod));
    console.log('🔄 Updated last updated period');
  }

  private filterPools(pools: PoolInfo[]) {
    // only kura v3. gauge or gaugeless. tokens in pair are whitelisted tokens.
    return pools.filter(pool => pool.poolKey.dexKey.type === DexType.KuraV3).filter(pool => {
      const token0Checksum = toChecksumAddress(pool.poolKey.token0);
      const token1Checksum = toChecksumAddress(pool.poolKey.token1);
      return WHITELISTED_TOKENS.includes(token0Checksum) && WHITELISTED_TOKENS.includes(token1Checksum);
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updatePools() {
    if (!this.isInitialized) return;

    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      const currentPeriod = this.kura.getCurrentPeriod();
      const pools = this.filterPools(this.kura.getPools());
      pools.forEach(async pool => {
        if (currentPeriod === this.lastUpdatedPeriod[pool.poolAddress.toLowerCase()]) return;
        await this.updatePool(pool, currentPeriod);
      });
    } catch (error) {
      console.error("[updatePools] error", error);
    } finally {
      this.isUpdating = false;
    }
  }

  async updatePool(pool: PoolInfo, currentPeriod: number) {
    try {
      const { fromToken, toToken } = this.getFromTokenAndToToken(pool);
      const amountIn = this.getSmallAmountIn(fromToken);
      const isSuccess = await this.roughSwap(pool, fromToken, toToken, amountIn);
      if (!isSuccess) return;
      this.lastUpdatedPeriod[pool.poolAddress.toLowerCase()] = currentPeriod;
      await this.slackService.sendMessage(`[EpochKeeping] roughSwap success for ${poolDescription(pool)}`, SlackChannel.Alert);
    } catch (error) {
      console.error(`[EpochKeeping] roughSwap failed for ${poolDescription(pool)}. ${error.message}`);
      if (!this.messageMap[error.message]) {
        await this.slackService.sendMessage(`[EpochKeeping] roughSwap failed for ${poolDescription(pool)}. ${error.message}`, SlackChannel.Alert);
        this.messageMap[error.message] = true;
      }
    }
  }

  getFromTokenAndToToken(pool: PoolInfo) {
    const fromTokenIndex = getAvailableOrderIndex(pool.poolKey.token0);
    const toTokenIndex = getAvailableOrderIndex(pool.poolKey.token1);
    const fromToken = fromTokenIndex < toTokenIndex ? pool.poolKey.token0 : pool.poolKey.token1;
    const toToken = fromTokenIndex < toTokenIndex ? pool.poolKey.token1 : pool.poolKey.token0;
    return { fromToken, toToken };
  }

  getSmallAmountIn(token: ChecksumAddress): string {
    const decimals = TOKEN_DECIMALS[token];
    if (!decimals) {
      throw new Error(`Decimals not found for ${getTokenSymbol(token)}, token: ${token}`);
    }
    const price = this.kura.getCurrentPrice(token);
    const amountIn = BigNumber(10).pow(decimals).multipliedBy(TARGET_VALUE).div(price).toFixed(0);
    return amountIn;
  }

  async roughSwap(pool: PoolInfo, tokenIn: ChecksumAddress, tokenOut: ChecksumAddress, amountIn: string): Promise<boolean> {
    if (pool.poolKey.dexKey.type === DexType.KuraV2) {
      throw new Error("KuraV2 pool is not supported");
    }
    try {
      const balance = await call(
        tokenIn,
        ["function balanceOf(address owner) external view returns (uint256)"],
        "balanceOf",
        [this.publicKey],
        this.rpcUrl
      );
      if (BigNumber(balance.toString()).lt(amountIn)) {
        throw new Error(`Insufficient balance(${formatUnits(amountIn, TOKEN_DECIMALS[toChecksumAddress(tokenIn)])}) of ${getTokenSymbol(tokenIn)} for roughSwap while updating pool ${poolDescription(pool)}`);
      }

      const allowance = await call(
        tokenIn,
        ["function allowance(address owner, address spender) external view returns (uint256)"],
        "allowance",
        [this.publicKey, KURA_SWAP_ROUTER],
        this.rpcUrl
      );
      if (BigNumber(allowance.toString()).lt(amountIn)) {
        const approveTxReceipt = await sendTransaction(
          tokenIn,
          ["function approve(address spender, uint256 amount) external returns (bool)"],
          this.privateKey,

          "approve",
          [KURA_SWAP_ROUTER, amountIn],
          this.rpcUrl
        );
        if (!approveTxReceipt || approveTxReceipt.status !== 1) {
          throw new Error(`Approve failed for ${getTokenSymbol(tokenIn)} while updating pool ${poolDescription(pool)} ${approveTxReceipt.hash}`);
        }
      }

      try {
        const slot0 = await call(
          pool.poolAddress,
          ["function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"],
          "slot0",
          [],
          this.rpcUrl
        );

        if (slot0[0].toString() === MIN_SQRT_RATIO_PLUS_ONE && tokenIn.toLowerCase() < tokenOut.toLowerCase()) {
          throw new Error(`stuck with the minimum price(${MIN_SQRT_RATIO_PLUS_ONE})`);
        }
        if (slot0[0].toString() === MAX_SQRT_RATIO_MINUS_ONE && tokenIn.toLowerCase() > tokenOut.toLowerCase()) {
          throw new Error(`stuck with the maximum price(${MAX_SQRT_RATIO_MINUS_ONE})`);
        }
      } catch (error) {
        console.log(`[EpochKeeping] slot0 failed for ${poolDescription(pool)}. ${error.message}`);
      }

      const swapTxReceipt = await sendTransaction(
        KURA_SWAP_ROUTER,
        KURA_SWAP_ROUTER_ABI,
        this.privateKey,
        "exactInputSingle",
        [{
          tokenIn,
          tokenOut,
          tickSpacing: pool.poolKey.dexKey.tickSpacing,
          recipient: this.publicKey,
          deadline: Math.floor(Date.now() / 1000) + 60,
          amountIn,
          amountOutMinimum: "0",
          sqrtPriceLimitX96: tokenIn.toLowerCase() < tokenOut.toLowerCase()
            ? MIN_SQRT_RATIO_PLUS_ONE
            : MAX_SQRT_RATIO_MINUS_ONE
        }],
        this.rpcUrl
      );
      if (!swapTxReceipt || swapTxReceipt.status !== 1) {
        throw new Error(`Swap failed for ${getTokenSymbol(tokenIn)} to ${getTokenSymbol(tokenOut)} while updating pool ${poolDescription(pool)} ${swapTxReceipt.hash}`);
      }
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }


}