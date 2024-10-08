import { WAMessage } from '@whiskeysockets/baileys';
import mime from 'mime-types';
import path from 'path';
import axios from 'axios';
import { Buffer } from 'buffer';
import Fuse from 'fuse.js';
import { fileTypeFromBuffer } from 'file-type';

// Define a type for MessageContent
type MessageContent =
    | string
    | Buffer
    | UrlMessage
    | LocationMessage
    | ContactMessage
    | ButtonMessage
    | ListMessage;

interface UrlMessage {
    url: string;
    caption?: string;
}

interface LocationMessage {
    latitude: number;
    longitude: number;
}

interface ContactMessage {
    name: string;
    phone: string;
}

interface ButtonMessage {
    text: string;
    buttons: Array<{ buttonId: string; buttonText: { displayText: string }; type: number }>;
    footer?: string;
}

interface ListMessage {
    text: string;
    sections: Array<{ title: string; rows: Array<{ title: string; rowId: string; description: string }> }>;
}

interface GenerateMessageOptions {
    quoted?: WAMessage;
    mentions?: string[];
    fileName?: string;
    mimetype?: string;
}

// Update AnyMessageContent to include all possible message structures
type CustomAnyMessageContent = {
    text?: string;
    image?: { url: string; caption?: string; mimetype?: string };
    video?: { url: string; caption?: string; mimetype?: string };
    audio?: { url: string; ptt?: boolean; seconds?: number; mimetype?: string };
    document?: { url: string; mimetype?: string; fileName?: string };
    location?: { degreesLatitude: number; degreesLongitude: number };
    contacts?: { displayName: string; vcard: string }[];
    buttonsMessage?: {
        contentText: string;
        buttons: Array<{ buttonId: string; buttonText: { displayText: string }; type: number }>;
        headerType: number;
        footerText?: string;
    };
    listMessage?: {
        title: string;
        buttonText: string;
        sections: Array<{ title: string; rows: Array<{ title: string; rowId: string; description: string }> }>;
    };
    quoted?: WAMessage;
    mentions?: string[];
};

const messageTypes = ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'button', 'list'];
const fuse = new Fuse(messageTypes, { includeScore: true });

async function detectContentType(content: string | Buffer): Promise<{ type: string; mimeType: string }> {
    if (Buffer.isBuffer(content)) {
        const mimeType = await fileTypeFromBuffer(content);
        return {
            type: mimeType?.mime.split('/')[0] || 'document',
            mimeType: mimeType?.mime || 'application/octet-stream',
        };
    } else if (typeof content === 'string') {
        if (content.startsWith('data:')) {
            const mimeType = content.split(';')[0].split(':')[1];
            return { type: mimeType.split('/')[0], mimeType };
        }
        if (content.startsWith('http://') || content.startsWith('https://')) {
            try {
                const response = await axios.head(content);
                const mimeType = response.headers['content-type'] || 'application/octet-stream';
                return { type: mimeType.split('/')[0], mimeType };
            } catch (error) {
                console.error('Error detecting MIME type:', error);
                return { type: 'document', mimeType: 'application/octet-stream' };
            }
        }
    }
    return { type: 'text', mimeType: 'text/plain' };
}

function generateFileName(url: string, mimeType: string): string {
    const urlFileName = path.basename(url).split('?')[0];
    if (urlFileName && mime.extension(mimeType)) {
        return urlFileName;
    }
    const ext = mime.extension(mimeType) || 'bin';
    return `file.${ext}`;
}

function fuzzyMatchMessageType(type: string): string {
    const result = fuse.search(type);
    return result.length > 0 ? result[0].item : 'text';
}

export default async function generateMsgFromBody(
    messageContent: MessageContent,
    options: GenerateMessageOptions = {}
): Promise<CustomAnyMessageContent> {
    let content: CustomAnyMessageContent = {};

    try {
        if (typeof messageContent === 'string' || Buffer.isBuffer(messageContent)) {
            const { type, mimeType } = await detectContentType(messageContent);
            const matchedType = fuzzyMatchMessageType(type);

            switch (matchedType) {
                case 'text':
                    content.text = messageContent.toString();
                    break;
                case 'image':
                case 'video':
                case 'audio':
                    content[matchedType] = { url: typeof messageContent === 'string' ? messageContent : '' };
                    break;
                default:
                    content.document = {
                        url: typeof messageContent === 'string' ? messageContent : '',
                        mimetype: mimeType,
                        fileName: options.fileName || generateFileName(typeof messageContent === 'string' ? messageContent : '', mimeType)
                    };
                    break;
            }
        } else if ('url' in messageContent) {
            const { type, mimeType } = await detectContentType(messageContent.url);
            const matchedType = fuzzyMatchMessageType(type);

            content[matchedType] = {
                url: messageContent.url,
                ...(matchedType === 'document' && { mimetype: mimeType, fileName: options.fileName || generateFileName(messageContent.url, mimeType) }),
            };

            if (messageContent.caption) {
                content.image.caption = messageContent.caption; // Assuming it's an image
            }
        } else if ('latitude' in messageContent && 'longitude' in messageContent) {
            content.location = { degreesLatitude: messageContent.latitude, degreesLongitude: messageContent.longitude };
        } else if ('name' in messageContent && 'phone' in messageContent) {
            content.contacts = [{
                displayName: messageContent.name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${messageContent.name}\nTEL;type=CELL;type=VOICE;waid=${messageContent.phone}:${messageContent.phone}\nEND:VCARD`
            }];
        } else if ('text' in messageContent && 'buttons' in messageContent) {
            content.buttonsMessage = {
                contentText: messageContent.text,
                buttons: messageContent.buttons,
                headerType: 1,
                ...(messageContent.footer && { footerText: messageContent.footer }),
            };
        } else if ('text' in messageContent && 'sections' in messageContent) {
            content.listMessage = {
                title: messageContent.text,
                buttonText: "Select",
                sections: messageContent.sections,
            };
        } else {
            throw new Error('Unsupported message type');
        }

        if (options.quoted) {
            content.quoted = options.quoted;
        }
        if (options.mentions) {
            content.mentions = options.mentions;
        }

        return content;
    } catch (error) {
        console.error('Error generating message:', error);
        throw new Error('Failed to generate message');
    }
}
