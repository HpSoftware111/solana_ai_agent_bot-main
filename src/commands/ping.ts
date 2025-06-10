import { CommandContext } from "grammy";
import { MyContext } from "../types";

export const pingpongCmd = async (ctx: CommandContext<MyContext>) => {
    console.log("/ping");
    await ctx.reply("pong");
}