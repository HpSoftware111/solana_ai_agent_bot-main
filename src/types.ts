import { Bot, Context, SessionFlavor } from "grammy";
import { config } from "./config";
import { Conversation, ConversationFlavor } from "@grammyjs/conversations";

// Define the shape of our session.
export interface SessionData {
  token: string | undefined;
}

// Flavor the context type to include sessions.
//type MyContext = Context & SessionFlavor<SessionData>;
export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;