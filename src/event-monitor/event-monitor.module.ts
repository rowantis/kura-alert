import { Module } from '@nestjs/common';
import { EventMonitorService } from './event-monitor.service';
import { SlackModule } from 'src/slack/slack.module';

@Module({
  imports: [SlackModule],
  providers: [EventMonitorService],
  exports: [EventMonitorService],
})
export class EventMonitorModule { }
