import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventMonitor } from "src/event-monitor/event-monitor";
import { getTokenSymbol } from "src/utils/kura-alert/utils";
import { poolDescription } from "src/utils/pool";
import { AddLiquidityEvent, RemoveLiquidityEvent, SwapEvent } from "src/utils/kura-alert/swapEvent";
import { SlackService } from "src/slack/slack.service";
import { SlackChannel } from "src/utils/enums";
import { WHITE_LISTED_SENDERS } from "src/utils/constants";
import { JsonRpcProvider } from "ethers";
import { KuraService } from "src/kura/kura.service";
import { toChecksumAddress } from "src/utils/kura-alert/address";

@Injectable()
export class EventMonitorService {
  private eventMonitor: EventMonitor;
  private isInitialized: boolean = false;
  public url: string;

  private threshold1: number = process.env.NODE_ENV === 'production' ? 10000 : 1;
  private threshold2: number = process.env.NODE_ENV === 'production' ? 1000 : 0.1;

  constructor(
    private readonly slackService: SlackService,
    private readonly kura: KuraService,
  ) { }

  async init() {
    if (this.isInitialized) return;

    // 풀 데이터가 준비될 때까지 폴링
    let pools = this.kura.getPools();
    let retryCount = 0;
    while (pools.length === 0 && retryCount < 10) {
      console.log('⏳ Waiting for pools data to be available...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      pools = this.kura.getPools();
      retryCount++;
    }
    if (pools.length === 0) {
      throw new Error('❌ Pools data is not available after 20 seconds');
    }

    console.log(`📊 Pools data ready: ${pools.length} pools available`);

    const wsUrl = process.env.NODE_RPC_URLS?.split(',')[0];
    this.url = wsUrl || '';
    if (!wsUrl) {
      throw new Error('❌ WS_URL is not set');
    }

    this.eventMonitor = new EventMonitor({
      wsUrl,
      pools,
      onSwapEvent: async (swapEvent: SwapEvent) => {
        await this.noticeBigSwap(swapEvent);
      },
      onAddLiquidityEvent: async (addEvent: AddLiquidityEvent) => {
        await this.noticeBigAddLiquidity(addEvent);
      },
      onRemoveLiquidityEvent: async (removeEvent: RemoveLiquidityEvent) => {
        await this.noticeBigRemoveLiquidity(removeEvent);
      },
      onError: (error) => {
        console.error('❌ Monitor error:', error);
      }
    });

    await this.eventMonitor.start();
    this.isInitialized = true;

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping event monitor...');
      this.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping event monitor...');
      this.destroy();
      process.exit(0);
    });
  }

  @Cron('*/10 * * * * *') // Every 10 seconds
  async ping() {
    if (this.isInitialized && this.eventMonitor) {
      this.eventMonitor.ping();
    }
  }

  @Cron(CronExpression.EVERY_HOUR) // Every hour
  async updatePools() {
    const pools = this.kura.getPools();
    this.eventMonitor.updatePools(pools);
  }

  async destroy() {
    if (!this.isInitialized) return;
    this.eventMonitor.stop();
    this.isInitialized = false;
  }

  isWhiteListedSender(sender: string): boolean {
    return WHITE_LISTED_SENDERS.includes(toChecksumAddress(sender));
  }

  createSwapEventLogMessage(swapEvent: SwapEvent, amountInUSD: number, amountInUSDThreshold: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Swap Event over ${amountInUSDThreshold} USD Detected!` : `💰 [Non-Team-Account] Swap Event over ${amountInUSDThreshold} USD Detected!`,
      '='.repeat(50),
      `💰 Amount in USD: ${amountInUSD.toFixed(2)}`,
      `🏊 Pool: ${poolDescription(swapEvent.pool)}`,
      `🔄 Direction: ${getTokenSymbol(swapEvent.tokenIn)} → ${getTokenSymbol(swapEvent.tokenOut)}`,
      `📦 Block: ${swapEvent.blockNumber}`,
      `👤 Sender: ${sender}`,
      `🔗 TX Hash: ${swapEvent.transactionHash}`,
      '='.repeat(50),
      ''
    ].filter(line => line !== '').join('\n');

    return logMessage;
  }

  async getTransactionSender(swapEvent: SwapEvent | AddLiquidityEvent | RemoveLiquidityEvent) {
    const wsUrl = this.eventMonitor.config.wsUrl;
    const provider = new JsonRpcProvider(wsUrl.replace('ws', 'http'));
    const tx = await provider.getTransaction(swapEvent.transactionHash);
    return tx?.from || '';
  }

  getAmountInUSD = (eventData: {
    event: SwapEvent,
    eventType: "swap"
  } | {
    event: AddLiquidityEvent,
    eventType: "addLiquidity"
  } | {
    event: RemoveLiquidityEvent,
    eventType: "removeLiquidity"
  }) => {
    const { event, eventType } = eventData;
    if (eventType === "swap") {
      return parseFloat(event.amountIn) * this.kura.getCurrentPrice(event.tokenIn);
    } else if (eventType === "addLiquidity") {
      return parseFloat(event.amount0) * this.kura.getCurrentPrice(event.token0) + parseFloat(event.amount1) * this.kura.getCurrentPrice(event.token1);
    } else if (eventType === "removeLiquidity") {
      return parseFloat(event.amount0) * this.kura.getCurrentPrice(event.token0) + parseFloat(event.amount1) * this.kura.getCurrentPrice(event.token1);
    }
    return 0;
  }

  async checkAndSendMessage(
    amountInUSDThreshold: number,
    eventData: {
      event: SwapEvent,
      eventType: "swap"
    } | {
      event: AddLiquidityEvent,
      eventType: "addLiquidity"
    } | {
      event: RemoveLiquidityEvent,
      eventType: "removeLiquidity"
    }
  ) {
    const { event, eventType } = eventData;
    const amountInUSD = this.getAmountInUSD(eventData);
    if (amountInUSD < amountInUSDThreshold) return false;
    const sender = await this.getTransactionSender(event);
    let message = '';
    if (eventType === "swap") {
      message = this.createSwapEventLogMessage(event, amountInUSD, amountInUSDThreshold, sender);
    } else if (eventType === "addLiquidity") {
      message = this.createAddLiquidityEventLogMessage(event, amountInUSD, amountInUSDThreshold, sender);
    } else if (eventType === "removeLiquidity") {
      message = this.createRemoveLiquidityEventLogMessage(event, amountInUSD, amountInUSDThreshold, sender);
    }
    await this.slackService.sendMessage(message, SlackChannel.Trading);
    return true;
  }


  createAddLiquidityEventLogMessage(addEvent: AddLiquidityEvent, amountInUSD: number, amountInUSDThreshold: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Add Liquidity Event over ${amountInUSDThreshold} USD Detected!` : `💰 [Non-Team-Account] Add Liquidity Event over ${amountInUSDThreshold} USD Detected!`,
      '='.repeat(50),
      `💰 Amount in USD: ${amountInUSD.toFixed(2)}`,
      `🏊 Pool: ${poolDescription(addEvent.pool)}`,
      `📦 Block: ${addEvent.blockNumber}`,
      `👤 Sender: ${sender}`,
      `🔗 TX Hash: ${addEvent.transactionHash}`,
      '='.repeat(50),
      ''
    ].filter(line => line !== '').join('\n');

    return logMessage;
  }
  createRemoveLiquidityEventLogMessage(removeEvent: RemoveLiquidityEvent, amountInUSD: number, amountInUSDThreshold: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Remove Liquidity Event over ${amountInUSDThreshold} USD Detected!` : `💰 [Non-Team-Account] Remove Liquidity Event over ${amountInUSDThreshold} USD Detected!`,
      '='.repeat(50),
      `💰 Amount in USD: ${amountInUSD.toFixed(2)}`,
      `🏊 Pool: ${poolDescription(removeEvent.pool)}`,
      `📦 Block: ${removeEvent.blockNumber}`,
      `👤 Sender: ${sender}`,
      `🔗 TX Hash: ${removeEvent.transactionHash}`,
      '='.repeat(50),
      ''
    ].filter(line => line !== '').join('\n');

    return logMessage;
  }

  async noticeBigSwap(swapEvent: SwapEvent) {
    const isNoticed = await this.checkAndSendMessage(
      this.threshold1,
      {
        event: swapEvent,
        eventType: "swap",
      }
    );
    if (isNoticed) return;
    await this.checkAndSendMessage(
      this.threshold2,
      {
        event: swapEvent,
        eventType: "swap",
      }
    );
  }

  async noticeBigAddLiquidity(addEvent: AddLiquidityEvent) {
    const isNoticed = await this.checkAndSendMessage(
      this.threshold1,
      {
        event: addEvent,
        eventType: "addLiquidity",
      }
    );
    if (isNoticed) return;
    await this.checkAndSendMessage(
      this.threshold2,
      {
        event: addEvent,
        eventType: "addLiquidity",
      }
    );
  }
  async noticeBigRemoveLiquidity(removeEvent: RemoveLiquidityEvent) {
    const isNoticed = await this.checkAndSendMessage(
      this.threshold1,
      {
        event: removeEvent,
        eventType: "removeLiquidity",
      }
    );
    if (isNoticed) return;
    await this.checkAndSendMessage(
      this.threshold2,
      {
        event: removeEvent,
        eventType: "removeLiquidity",
      }
    );
  }
}