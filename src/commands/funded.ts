import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, sol, solscanRequestOptions } from "../config";
import { formatUnits, isBase58SolanaWalletAddress, shortenAddress } from "../utils";

export const funded = async (ctx: CommandContext<MyContext>) => {
    const param = ctx.match;
    console.log("/funded", param)
    if(!isBase58SolanaWalletAddress(param)) {
        await ctx.reply("Token address is not correct")
        return
    }
    let replyText = "";
    try {
        const data: any[] = (await (await fetch(
            `${config.SOLSCAN_URL}/account/transfer?address=${param}&token=${sol}&to=${param}&page=1&page_size=10&sort_by=block_time&sort_order=asc`,
            solscanRequestOptions
          )).json()).data
        if(!data.length){
            await ctx.reply("Wallet is not funded yet.")
            return
        }
        
        replyText += `📊 Funding Report for <a href="https://solscan.io/account/${param}">${shortenAddress(param)}</a>

🔗 Funding Transaction(s):`
        const txnArray: string[] = []
        const addressArray: string[] = []
        let fundedSol = 0
        data.forEach(tx => {
            txnArray.push(tx.trans_id)
            addressArray.push(tx.from_address)
            fundedSol += tx.amount
        })

        const txnsText = txnArray.map((value) => `<a href="https://solscan.io/tx/${value}">${shortenAddress(value)}</a>`).join(", ")
        const addressesText = [...new Set(addressArray)].map((value) => `<a href="https://solscan.io/address/${value}">${shortenAddress(value)}</a>`).join(", ")

        replyText += `${txnsText}

💸 Funding Wallet(s): ${addressesText}
💰 Amount Funded: <code>${formatUnits(fundedSol, 9).toFixed(2)} SOL</code>
📅 Wallet Created: ${data[0].time}
        `

        await ctx.reply(replyText, {
            parse_mode: "HTML"
        })
        
    } catch (error) {
        console.log("fundedError", error)
    }

}