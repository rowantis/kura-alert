import { PoolInfo, PoolData, DexType } from '../utils/kura-alert/types';
import { ABI_FOR_DEX_TYPE, AddLiquidityEvent, RemoveLiquidityEvent, SwapEvent, parseAddLiquidityEvent, parseRemoveLiquidityEvent, parseSwapEvent } from '../utils/kura-alert/swapEvent';
import { WebSocketManager, WebSocketConfig } from '../utils/websocket-manager';

export interface SwapEventMonitorConfig {
  wsUrl: string;
  poolsData: PoolData;
  onSwapEvent?: (swapEvent: SwapEvent) => void;
  onAddLiquidityEvent?: (addEvent: AddLiquidityEvent) => void;
  onRemoveLiquidityEvent?: (removeEvent: RemoveLiquidityEvent) => void;
  onError?: (error: Error) => void;
}

export class EventMonitor {
  public config: SwapEventMonitorConfig;
  private wsManager: WebSocketManager;
  private allPools: PoolInfo[] = [];

  constructor(config: SwapEventMonitorConfig) {
    this.config = config;
    this.allPools = [
      ...config.poolsData.kuraV2Pools,
      ...config.poolsData.kuraV3Pools,
    ];

    const wsConfig: WebSocketConfig = {
      url: config.wsUrl,
      onConnect: () => this.handleConnect(),
      onDisconnect: (code, reason) => this.handleDisconnect(code, reason),
      onError: (error) => this.handleError(error),
      onMessage: (message) => this.handleMessage(message)
    };

    this.wsManager = new WebSocketManager(wsConfig);
  }

  public async start(): Promise<void> {
    await this.wsManager.connect();
  }

  public stop(): void {
    this.wsManager.disconnect();
  }

  private handleConnect(): void {
    const subscriptions: { contractAddress: string, abi: any, eventName: string }[] = [];
    this.allPools.forEach(pool => {
      const abi = ABI_FOR_DEX_TYPE[pool.poolKey.dexKey.type];
      subscriptions.push({
        contractAddress: pool.poolAddress,
        abi,
        eventName: 'Swap'
      });
      subscriptions.push({
        contractAddress: pool.poolAddress,
        abi,
        eventName: 'Mint'
      });
      subscriptions.push({
        contractAddress: pool.poolAddress,
        abi,
        eventName: 'Burn'
      });
    });
    this.wsManager.subscribeToEvents(subscriptions);
  }

  private handleDisconnect(code: number, reason: string): void {
  }

  private handleError(error: Error): void {
    this.config.onError?.(error);
  }

  private handleMessage(message: any): void {
    if (message.result && typeof message.result === 'string') return;
    if (message.method !== 'eth_subscription') return;
    if (!message.params) return;

    const event = message.params.result;
    const pool = this.allPools.find(p => p.poolAddress.toLowerCase() === event.address.toLowerCase());
    if (!pool) return;
    const swapEvent = parseSwapEvent(event, pool);
    const addEvent = parseAddLiquidityEvent(event, pool);
    const removeEvent = parseRemoveLiquidityEvent(event, pool);

    if (swapEvent) {
      this.config.onSwapEvent?.(swapEvent);
    }
    if (addEvent) {
      this.config.onAddLiquidityEvent?.(addEvent);
    }
    if (removeEvent) {
      this.config.onRemoveLiquidityEvent?.(removeEvent);
    }
  }

  public getPoolCount(): number {
    return this.allPools.length;
  }

  public isConnected(): boolean {
    return this.wsManager.isConnected();
  }

  public getReconnectAttempts(): number {
    return this.wsManager.getReconnectAttempts();
  }

  public ping(): void {
    this.wsManager.ping();
  }
} 