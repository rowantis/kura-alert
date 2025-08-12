import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventMonitorModule } from './event-monitor/event-monitor.module';
import { EpochKeepingModule } from './epoch-keeping/epoch-keeping.module';
import { KuraModule } from './kura/kura.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventMonitorModule,
    EpochKeepingModule,
    KuraModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
