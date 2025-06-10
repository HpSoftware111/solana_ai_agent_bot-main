import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config } from "../config";
import { isBase58SolanaWalletAddress } from "../utils";

export const checkDex = async (ctx: CommandContext<MyContext>) => {
    const param = ctx.match;
    console.log("/check_dex", param)
    if(!isBase58SolanaWalletAddress(param)) {
        await ctx.reply("Token address is not correct")
        return
    }
    let replyText = "";
    try {
        const response = await fetch(config.DEXSCREENER_URL + "/token-pairs/v1/solana/" + param)
        const data = await response.json()
        console.log("checkDexError", data)

        if(data.length) {
            for (let index = 0; index < data.length; index++) {
                if(index >= 5) break
                const element = data[index];
                replyText += `Dex: ${element.dexId} 
                Pair Address: <code>${element.pairAddress}</code>
                Price Native: ${element.priceNative} 
                Price USD: ${element.priceUsd} 
                Liquidity: ${element.liquidity?.usd || 0} 
                Market Cap: ${element.marketCap} \n\n
`
            }
        }
        await ctx.reply(replyText, {
            parse_mode: "HTML"
        })
        
    } catch (error) {
        console.log("checkDexError", error)
    }

}