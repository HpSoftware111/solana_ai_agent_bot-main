import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { isBase58SolanaWalletAddress } from "../utils";

export const domain = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/domain", param);
  let replyText = "";
  try {
    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?outputFormat=json&domainName=${param}&apiKey=${config.WHOIS_API}`
    );
    const data = (await response.json()).WhoisRecord;
    console.log("data", data);
    if (!data.dataError) {
      const registrarName = data.registrarName;
      const createdDate = data.registryData.createdDate;
      const expiresDate = data.registryData.expiresDate;
      replyText += `<code>${param}</code> is registered on <code>${registrarName}</code> \n Created Date: <code>${createdDate}</code> \n Expires Date: <code>${expiresDate}</code>\n`;

      await ctx.reply(replyText, {
        parse_mode: "HTML",
      });
    } else {
      await ctx.reply("Please input correct domain.");
    }
  } catch (error) {
    console.log("domainError", error);
    await ctx.reply("Please input correct domain.");
  }
};
