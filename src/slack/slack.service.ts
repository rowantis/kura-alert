import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SlackChannel } from './../utils/enums';
import { errorWithTime } from 'src/utils/logger';

@Injectable()
export class SlackService {
  private readonly webhookAlertUrl: string;

  constructor() {
    this.webhookAlertUrl = String(process.env.WEBHOOK_ALERT_URL);
  }

  async sendMessage(message: string, channel: SlackChannel, userId?: string) {
    const userMentions = userId ? `${userId}` : '';
    const formattedMessage = `\`\`\`${message}\`\`\``;
    const taggedMessage = `${userMentions}\n${formattedMessage}`;

    const payload = { text: taggedMessage };

    try {
      if (channel === SlackChannel.Alert) {
        const response = await axios.post(this.webhookAlertUrl, payload);
        return response.data;
      } else {
        throw new Error('Invalid channel');
      }
    } catch (error) {
      errorWithTime('Error sending message to Slack:', error);
      throw error;
    }
  }

  async boldMessage(message: string) {
    return `*${message}*`;
  }

  async codeMessage(message: string) {
    return `\`\`\`${message}\`\`\``;
  }
}
