import { Document } from "mongodb";
import { AuthenticationCreds } from "@whiskeysockets/baileys";

export interface AuthDocument extends Document {
    _id: string;
    creds?: AuthenticationCreds;
}