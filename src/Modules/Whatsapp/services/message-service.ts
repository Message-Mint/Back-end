import { Injectable } from '@nestjs/common';
import { SocketService } from './socket-service';
import { LoggerService } from 'src/Helpers/Logger/logger-service';
import { AnyMessageContent, proto, WAMessage } from '@whiskeysockets/baileys';
@Injectable()
export class MessagingService {
  constructor(
    private readonly socketService: SocketService,
    private readonly logger: LoggerService,
  ) {}

  async sendTextMessage(
    instanceId: string,
    recipient: string,
    message: string,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      await socket.sendMessage(recipient, { text: message });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendMediaMessage(
    instanceId: string,
    recipient: string,
    mediaType: 'image' | 'video' | 'document',
    {
      mediaUrl,
      caption,
      fileName,
      mimeType,
    }: {
      mediaUrl: string;
      caption?: string;
      fileName?: string;
      mimeType?: string;
    },
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      let mediaMessage: AnyMessageContent;

      switch (mediaType) {
        case 'image':
          mediaMessage = {
            image: { url: mediaUrl },
            caption: caption || '',
          };
          break;
        case 'video':
          mediaMessage = {
            video: { url: mediaUrl },
            caption: caption || '',
          };
          break;
        case 'document':
          mediaMessage = {
            document: { url: mediaUrl },
            caption: caption || '',
            fileName: fileName || 'document',
            mimetype: mimeType || 'application/octet-stream', // Default MIME type for unknown file types
          };
          break;
        default:
          throw new Error('Unsupported media type');
      }

      await socket.sendMessage(recipient, mediaMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send media message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendButtonMessage(
    instanceId: string,
    recipient: string,
    content: string,
    buttons: any[],
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const buttonMessage = {
        text: content,
        footer: 'Powered by Your App',
        buttons,
        headerType: 1,
      };
      await socket.sendMessage(recipient, buttonMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send button message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendListMessage(
    instanceId: string,
    recipient: string,
    title: string,
    text: string,
    buttonText: string,
    sections: any[],
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const listMessage = {
        text,
        footer: 'Powered by Razan',
        title,
        buttonText,
        sections,
      };
      await socket.sendMessage(recipient, listMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send list message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendLocationMessage(
    instanceId: string,
    recipient: string,
    latitude: number,
    longitude: number,
    name?: string,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const locationMessage = {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
          name,
        },
      };
      await socket.sendMessage(recipient, locationMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send location message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendContactMessage(
    instanceId: string,
    recipient: string,
    contactNumber: string,
    contactName: string,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const contactMessage = {
        contacts: {
          displayName: contactName,
          contacts: [
            {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;type=CELL;type=VOICE;waid=${contactNumber}:${contactNumber}\nEND:VCARD`,
            },
          ],
        },
      };
      await socket.sendMessage(recipient, contactMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send contact message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendPollMessage(
    instanceId: string,
    recipient: string,
    name: string,
    options: string[],
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const pollMessage = {
        poll: {
          name,
          values: options,
          selectableCount: options.length,
        },
      };
      await socket.sendMessage(recipient, pollMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send poll message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendReaction(
    instanceId: string,
    jid: string,
    emoji: string,
    key: proto.IMessageKey,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      await socket.sendMessage(jid, {
        react: {
          text: emoji,
          key,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send reaction for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendAudioMessage(
    instanceId: string,
    recipient: string,
    audioUrl: string,
    ptt: boolean = false,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const audioMessage = {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt, // Set to true for voice notes, false for audio files
      };
      await socket.sendMessage(recipient, audioMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send audio message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async sendStickerMessage(
    instanceId: string,
    recipient: string,
    stickerUrl: string,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      const stickerMessage = {
        sticker: { url: stickerUrl },
      };
      await socket.sendMessage(recipient, stickerMessage);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send sticker message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }

  async forwardMessage(
    instanceId: string,
    recipient: string,
    message: WAMessage,
  ): Promise<boolean> {
    try {
      const socket = await this.socketService.getOrCreateSocket(instanceId);
      await socket.sendMessage(recipient, { forward: message });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to forward message for instance ${instanceId}`,
        error,
      );
      return false;
    }
  }
}
