import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { MessagingService } from './services/message-service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  SendButtonMessageDto,
  SendContactMessageDto,
  SendListMessageDto,
  SendLocationMessageDto,
  SendMediaMessageDto,
  SendTextMessageDto,
} from './types/message-types';
import { LoggerService } from 'src/Helpers/Logger/logger-service';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly logger: LoggerService,
  ) {}

  @Post(':instanceId/send-text')
  @ApiOperation({ summary: 'Send a text message' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendTextMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendTextMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendTextMessage(
        instanceId,
        body.recipient,
        body.message,
      );
      if (!success) {
        throw new HttpException(
          'Failed to send text message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Text message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send text message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':instanceId/send-media')
  @ApiOperation({ summary: 'Send a media message' })
  @ApiResponse({ status: 200, description: 'Media message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendMediaMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendMediaMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendMediaMessage(
        instanceId,
        body.recipient,
        body.mediaType,
        {
          mediaUrl: body.mediaUrl,
          caption: body.caption,
          fileName: body.fileName,
          mimeType: body.mimeType,
        },
      );
      if (!success) {
        throw new HttpException(
          'Failed to send media message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Media message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send media message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':instanceId/send-button')
  @ApiOperation({ summary: 'Send a button message' })
  @ApiResponse({ status: 200, description: 'Button message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendButtonMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendButtonMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendButtonMessage(
        instanceId,
        body.recipient,
        body.content,
        body.buttons,
      );
      if (!success) {
        throw new HttpException(
          'Failed to send button message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Button message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send button message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':instanceId/send-list')
  @ApiOperation({ summary: 'Send a list message' })
  @ApiResponse({ status: 200, description: 'List message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendListMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendListMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendListMessage(
        instanceId,
        body.recipient,
        body.title,
        body.text,
        body.buttonText,
        body.sections,
      );
      if (!success) {
        throw new HttpException(
          'Failed to send list message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'List message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send list message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':instanceId/send-location')
  @ApiOperation({ summary: 'Send a location message' })
  @ApiResponse({
    status: 200,
    description: 'Location message sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendLocationMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendLocationMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendLocationMessage(
        instanceId,
        body.recipient,
        body.latitude,
        body.longitude,
        body.name,
      );
      if (!success) {
        throw new HttpException(
          'Failed to send location message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Location message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send location message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':instanceId/send-contact')
  @ApiOperation({ summary: 'Send a contact message' })
  @ApiResponse({
    status: 200,
    description: 'Contact message sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendContactMessage(
    @Param('instanceId') instanceId: string,
    @Body() body: SendContactMessageDto,
  ) {
    try {
      const success = await this.messagingService.sendContactMessage(
        instanceId,
        body.recipient,
        body.contactNumber,
        body.contactName,
      );
      if (!success) {
        throw new HttpException(
          'Failed to send contact message',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Contact message sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send contact message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
