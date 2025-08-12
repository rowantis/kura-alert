import { Module } from '@nestjs/common';
import { KuraService } from './kura.service';
import { SlackModule } from 'src/slack/slack.module';

@Module({
  imports: [SlackModule],
  providers: [KuraService],
  exports: [KuraService],
})
export class KuraModule { }
