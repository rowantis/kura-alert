import { Module } from '@nestjs/common';
import { EpochKeepingService } from './epoch-keeping.service';
import { SlackModule } from 'src/slack/slack.module';
import { KuraModule } from 'src/kura/kura.module';

@Module({
  imports: [SlackModule, KuraModule],
  providers: [EpochKeepingService],
  exports: [EpochKeepingService],
})
export class EpochKeepingModule { }
