import {
  Controller,
  Sse,
  Param,
  NotFoundException,
  UseGuards,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, throwError } from 'rxjs';
import { SocketService } from './services/socket-service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(
    private eventEmitter: EventEmitter2,
    private socket: SocketService,
  ) {}

  @Sse('qr/:userId')
  qrStream(@Param('userId') instanceID: string): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.socket
        .getOrCreateSocket(instanceID)
        .then(() => {
          const qrListener = (qrData: { data: string }) => {
            observer.next({ data: qrData.data } as MessageEvent);

            if (qrData.data === 'Connected!') {
              observer.complete();
            }
          };

          this.eventEmitter.on(`qr.update.${instanceID}`, qrListener);

          return () => {
            this.eventEmitter.removeListener(
              `qr.update.${instanceID}`,
              qrListener,
            );
          };
        })
        .catch((error) => {
          observer.error({ data: JSON.stringify({ error: error.message }) });
          observer.complete();
        });
    });
  }

  @Post(':instanceId/pairing-code')
  async generatePairingCode(
    @Param('instanceId') instanceId: string,
    @Body('whatsappNumber') whatsappNumber: string,
  ) {
    try {
      const pairingCode = await this.socket.generatePairingCode(
        instanceId,
        whatsappNumber,
      );
      return { pairingCode };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('logout/:instanceId')
  async logoutInstance(
    @Param('instanceId') instanceId: string,
  ): Promise<{ message: string }> {
    await this.socket.loggedOutEndSocket(instanceId);
    return { message: 'Instance logged out successfully' };
  }

  @Post('close/:instanceId')
  async closeInstance(
    @Param('instanceId') instanceId: string,
  ): Promise<{ message: string }> {
    await this.socket.stopSocket(instanceId);
    return { message: 'Instance Closed successfully' };
  }
}
