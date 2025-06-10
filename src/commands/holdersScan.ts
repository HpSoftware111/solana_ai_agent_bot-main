import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { Connection, PublicKey } from "@solana/web3.js";
import { isBase58SolanaWalletAddress } from "../utils";

export const holdersScan =  async (ctx: CommandContext<MyContext>) => {
    const param = ctx.match;
    console.log("/holderscan", param)
    if(!isBase58SolanaWalletAddress(param)) {
        await ctx.reply("Token address is not correct")
        return
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
          const tokenName = (metadata.name);

        const response = await fetch(config.SOLSCAN_URL + "/token/holders?address=" + param, solscanRequestOptions)
        const data1 = (await response.json())
        console.log("data1", data1)
        const data = data1.data
        console.log("data", data)
        const totalHolders = data.total

        replyText += `<code>${tokenName}</code> has <code>${totalHolders}</code> total holders.\n`
        await ctx.reply(replyText, {
            parse_mode: "HTML"
        })
        
    } catch (error) {
        console.log("holdersScan", error)
    await ctx.reply("Please input correct token address.")

    }

}