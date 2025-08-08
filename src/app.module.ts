import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventMonitorModule } from './event-monitor/event-monitor.module';

@Module({
  imports: [
    EventMonitorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
