import { CommandContext } from "grammy";
import { MyContext } from "../types";

export const guide = async (ctx: CommandContext<MyContext>) => {
    console.log("/guide");
    await ctx.reply(`The following gitbook is a comprehensive guide on AI Agent Bot:

https://mugetsu.gitbook.io/mugetsu`);
}