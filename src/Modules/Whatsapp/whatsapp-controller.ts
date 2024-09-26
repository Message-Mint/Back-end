import { Controller, Sse, Param, NotFoundException, UseGuards } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Observable, throwError } from "rxjs";
import { SocketService } from "./services/socket-service";
import { JwtAuthGuard } from "../Auth/jwt-auth-guard";

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
    constructor(
        private eventEmitter: EventEmitter2,
        private socket: SocketService
    ) { }

    @Sse('qr/:userId')
    qrStream(@Param('userId') instanceID: string): Observable<MessageEvent> {
        return new Observable(observer => {
            this.socket.getOrCreateSocket(instanceID)
                .then(() => {
                    const qrListener = (qrData: { data: string }) => {
                        observer.next({ data: qrData.data } as MessageEvent);

                        if (qrData.data === "Connected!") {
                            observer.complete();
                        }
                    };

                    this.eventEmitter.on(`qr.update.${instanceID}`, qrListener);

                    return () => {
                        this.eventEmitter.removeListener(`qr.update.${instanceID}`, qrListener);
                    };
                })
                .catch(error => {
                    observer.error({ data: JSON.stringify({ error: error.message }) });
                    observer.complete();
                });
        });
    }
}
