import { ethers } from 'ethers';

export interface WebSocketConfig {
  url: string;
  onConnect?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: any) => void;
}

export class WebSocketManager {
  private ws: any = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const WebSocket = require('ws');
      this.ws = new WebSocket(this.config.url);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.config.onConnect?.();
      });

      this.ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        this.config.onMessage?.(message);
      });

      this.ws.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.config.onError?.(error);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString();
        console.log(`🔌 WebSocket disconnected (code: ${code}, reason: ${reasonStr})`);
        this.isConnecting = false;
        this.config.onDisconnect?.(code, reasonStr);
        this.handleReconnect();
      });

    } catch (error) {
      console.error('❌ Failed to start WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. Stopping WebSocket manager.');
    }
  }

  public send(data: any): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket is not connected. Cannot send data.');
    }
  }

  public subscribeToEvents(subscriptions: { contractAddress: string, abi: any, eventName: string }[]): void {
    subscriptions.forEach((subscription, index) => {
      const event = subscription.abi.find((item: any) => item.type === 'event' && item.name === subscription.eventName);
      if (event) {
        const swapTopic = ethers.id(`${event.name}(${event.inputs.map((input: any) => input.type).join(',')})`);

        const request = {
          jsonrpc: '2.0',
          id: index + 1,
          method: 'eth_subscribe',
          params: [
            'logs',
            {
              address: subscription.contractAddress,
              topics: [swapTopic]
            }
          ]
        };

        this.send(request);
      } else {
        console.log(JSON.stringify(subscription.abi, null, 2));
        throw new Error(`Event ${subscription.eventName} not found in ${subscription.contractAddress}`);
      }
    });
    console.log(`📡 Subscribed to ${subscriptions.length} pools`);
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  public isConnected(): boolean {
    return this.ws && this.ws.readyState === 1;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public ping(): void {
    if (this.ws) {
      this.ws.ping();
    }
  }
} 