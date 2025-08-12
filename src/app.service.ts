import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventMonitorService } from './event-monitor/event-monitor.service';
import { EpochKeepingService } from './epoch-keeping/epoch-keeping.service';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private isShuttingDown = false;

  constructor(
    private readonly swapEventMonitorService: EventMonitorService,
    private readonly swapService: EpochKeepingService,
  ) {
    const shutdown = async (signal: string) => {
      console.log("shutting down")
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      try {
        await this.swapEventMonitorService.destroy();
        await this.swapService.destroy();
      } catch (e) {
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  getHello(): string {
    return 'Hello World!';
  }

  onModuleInit() {
    this.swapEventMonitorService.init();
    this.swapService.init();
  }

  async onModuleDestroy() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
  }
}
