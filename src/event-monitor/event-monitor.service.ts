import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EventMonitor } from "src/event-monitor/event-monitor";
import { DexType, PoolData } from "src/utils/kura-alert/types";
import { getTokenSymbol, TOKEN_PRICES } from "src/utils/kura-alert/utils";
import { poolDescription } from "src/utils/pool";
import { PATHS } from "src/utils/kura-alert/contract";
import * as fs from 'fs';
import { AddLiquidityEvent, RemoveLiquidityEvent, SwapEvent } from "src/utils/kura-alert/swapEvent";
import { SlackService } from "src/slack/slack.service";
import { SlackChannel } from "src/utils/enums";
import { WHITE_LISTED_SENDERS } from "src/utils/constants";
import { JsonRpcProvider } from "ethers";

@Injectable()
export class EventMonitorService {
  private eventMonitor: EventMonitor;
  private isInitialized: boolean = false;
  public url: string;

  private threshold1: number = 10000;
  private threshold2: number = 1000;

  constructor(
    private readonly slackService: SlackService,
  ) { }

  async init() {
    if (this.isInitialized) return;
    const poolsData: PoolData = JSON.parse(fs.readFileSync(PATHS.VALID_POOLS, 'utf8'));
    console.log(`📊 Loaded pools: ${poolsData.kuraV2Pools.length} KuraV2, ${poolsData.kuraV3Pools.length} KuraV3`);
    const wsUrl = process.env.NODE_RPC_URLS?.split(',')[0];
    this.url = wsUrl || '';
    if (!wsUrl) {
      throw new Error('❌ WS_URL is not set');
    }
    this.eventMonitor = new EventMonitor({
      wsUrl,
      poolsData,
      onSwapEvent: (swapEvent: SwapEvent) => {
        this.noticeBigSwap(swapEvent);
      },
      onAddLiquidityEvent: (addEvent: AddLiquidityEvent) => {
        this.noticeBigAddLiquidity(addEvent);
      },
      onRemoveLiquidityEvent: (removeEvent: RemoveLiquidityEvent) => {
        this.noticeBigRemoveLiquidity(removeEvent);
      },
      onError: (error) => {
        console.error('❌ Monitor error:', error);
      }
    });

    await this.eventMonitor.start();
    this.isInitialized = true;

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping event monitor...');
      this.eventMonitor.stop();
      process.exit(0);
    });
  }

  @Cron('*/10 * * * * *') // Every 10 seconds
  async ping() {
    if (this.isInitialized && this.eventMonitor) {
      this.eventMonitor.ping();
    }
  }

  async destroy() {
    if (!this.isInitialized) return;
    this.eventMonitor.stop();
    this.isInitialized = false;
  }

  isWhiteListedSender(sender: string): boolean {
    return WHITE_LISTED_SENDERS.map(s => s.toLowerCase()).includes(sender.toLowerCase());
  }

  createSwapEventLogMessage(swapEvent: SwapEvent, amountInUSD: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Swap Event over ${amountInUSD} USD Detected!` : `💰 [Non-Team-Account] Swap Event over ${amountInUSD} USD Detected!`,
      '='.repeat(50),
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
      return parseFloat(event.amountIn) * TOKEN_PRICES[event.tokenIn];
    } else if (eventType === "addLiquidity") {
      return parseFloat(event.amount0) * TOKEN_PRICES[event.token0] + parseFloat(event.amount1) * TOKEN_PRICES[event.token1];
    } else if (eventType === "removeLiquidity") {
      return parseFloat(event.amount0) * TOKEN_PRICES[event.token0] + parseFloat(event.amount1) * TOKEN_PRICES[event.token1];
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
      message = this.createSwapEventLogMessage(event, amountInUSDThreshold, sender);
    } else if (eventType === "addLiquidity") {
      message = this.createAddLiquidityEventLogMessage(event, amountInUSDThreshold, sender);
    } else if (eventType === "removeLiquidity") {
      message = this.createRemoveLiquidityEventLogMessage(event, amountInUSDThreshold, sender);
    }
    await this.slackService.sendMessage(message, SlackChannel.Alert);
    return true;
  }


  createAddLiquidityEventLogMessage(addEvent: AddLiquidityEvent, amountInUSD: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Add Liquidity Event over ${amountInUSD} USD Detected!` : `💰 [Non-Team-Account] Add Liquidity Event over ${amountInUSD} USD Detected!`,
      '='.repeat(50),
      `🏊 Pool: ${poolDescription(addEvent.pool)}`,
      `📦 Block: ${addEvent.blockNumber}`,
      `👤 Sender: ${sender}`,
      `🔗 TX Hash: ${addEvent.transactionHash}`,
      '='.repeat(50),
      ''
    ].filter(line => line !== '').join('\n');

    return logMessage;
  }
  createRemoveLiquidityEventLogMessage(removeEvent: RemoveLiquidityEvent, amountInUSD: number, sender: string) {
    const logMessage = [
      this.isWhiteListedSender(sender) ? `💰 [Team-Account] Remove Liquidity Event over ${amountInUSD} USD Detected!` : `💰 [Non-Team-Account] Remove Liquidity Event over ${amountInUSD} USD Detected!`,
      '='.repeat(50),
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