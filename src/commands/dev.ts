import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { isBase58SolanaWalletAddress } from "../utils";

export const dev = async (ctx: CommandContext<MyContext>) => {
    const param = ctx.match;
    console.log("/dev", param)
    if(!isBase58SolanaWalletAddress(param)) {
        await ctx.reply("Token address is not correct")
        return
    }
    let replyText = "";
    try {
        const response = await fetch(config.SOLSCAN_URL + "/token/meta?address=" + param, solscanRequestOptions)
        const data1 = (await response.json())
        console.log("data1", data1)
        const data = data1.data
        console.log("data", data)

        const createdTime = new Date()
        createdTime.setTime(data.created_time * 1000)
        console.log("devError", data)

                replyText += `Name: ${data.name}
Symbol: ${data.symbol}
Decimals: ${data.decimals}
Holder: ${data.holder}
Creator: <code>${data.creator} </code>
Create Tx: <code>${data.create_tx}</code>
Created Time: ${createdTime.toUTCString()}
Image: ${data.metadata.image}
Description: ${data.metadata.description}
Twitter: ${data.metadata.twitter || "None"}
Website: ${data.metadata.website|| "None"}
Mint Authority: ${data.mint_authority || "Revoked"}
Freeze Authority: ${data.freeze_authority || "Revoked"}
Supply: ${data.supply}
Price: ${data.price|| "None"}
Volume 24h: ${data.volume_24h || "None"}
MarketCap: ${data.market_cap}
MarketCapRank: ${data.market_cap_rank ||"None"}
PriceChange24h: ${data.price_change_24h|| "None"}
`
        await ctx.reply(replyText, {
            parse_mode: "HTML"
        })
        
    } catch (error) {
        console.log("devError", error)
        await ctx.reply("Please input correct token address.")
    }

}