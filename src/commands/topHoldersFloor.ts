import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { Connection, PublicKey } from "@solana/web3.js";
import { formatUnits, isBase58SolanaWalletAddress, shortenAddress, simplifyNumber } from "../utils";

export const topHoldersFloor = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/top_holders_floor", param);
  if (!isBase58SolanaWalletAddress(param)) {
    await ctx.reply("Token address is not correct");
    return;
  }
  let replyText = "";
  try {
    const metadata = (
      await (
        await fetch(
          config.SOLSCAN_URL + "/token/meta?address=" + param,
          solscanRequestOptions
        )
      ).json()
    ).data;
    console.log("metadata", metadata);
    const totalSupply = parseInt(metadata.supply);

    const data = (
      await (
        await fetch(
          config.SOLSCAN_URL + "/token/holders?page=1&page_size=20&address=" + param,
          solscanRequestOptions
        )
      ).json()
    ).data;
    console.log("data", data);

    if (data.items.length) {
        const dataText = data.items.map((item : any) => {
            const percent = (item.amount * 100 / totalSupply).toFixed(2)
            return `🟢<a href="https://solscan.io/account/${item.owner}">${shortenAddress(item.owner)}</a> (${percent}%) - @ <code>$${simplifyNumber(formatUnits( item.amount, metadata.decimals))}</code>`
        }).join("\n");
        replyText += `Top Holders Entries for <code>$${metadata.symbol}</code> - $${simplifyNumber(formatUnits( totalSupply, metadata.decimals))} \n\n`
        replyText += dataText
    }
    await ctx.reply(replyText, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log("topHoldersFloor", error);
    await ctx.reply("Please input correct token address.");
  }
};
