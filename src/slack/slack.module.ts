import { Module } from "@nestjs/common";
import { SlackService } from "./slack.service";

@Module({
  providers: [SlackService],
  exports: [SlackService], // Add this line to export SlackService
})
export class SlackModule { }
