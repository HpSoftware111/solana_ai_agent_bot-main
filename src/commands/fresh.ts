import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import {
  formatUnits,
  isBase58SolanaWalletAddress,
  shortenAddress,
  simplifyNumber,
} from "../utils";
import { isReadonlyKeywordOrPlusOrMinusToken } from "typescript";

export const fresh = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/fresh", param);
  if (!isBase58SolanaWalletAddress(param)) {
    await ctx.reply("Token address is not correct");
    return;
  }
  let replyText = "";
  try {
    const response0 = await fetch(
      config.SOLSCAN_URL + "/token/meta?address=" + param,
      solscanRequestOptions
    );
    const data01 = await response0.json();
    console.log("data01", data01);
    const data0 = data01.data;
    console.log("data0", data0);
    const totalSupply = parseInt(data0.supply);
    const tokenName = data0.name;
    const tokenSymbol = data0.symbol;
    const created_time = new Date()
    created_time.setTime(data0.created_time)


    const response = await fetch(
      config.SOLSCAN_URL +
        "/token/holders?page=1&page_size=10&address=" +
        param,
      solscanRequestOptions
    );
    const data1 = await response.json();
    console.log("data1", data1);
    const data2 = data1.data;
    console.log("data2", data2);

    if (data2.items.length) {
      const items: any[] = data2.items;
      const rows =  await Promise.all(items.map((holder) => {
        const func = async () => {
          const address = holder.owner;
          const percent = ((holder.amount * 100) / totalSupply).toFixed(2);
          const res = await fetch(
            `${config.SOLSCAN_URL}/token/transfer?address=${param}&activity_type[]=ACTIVITY_SPL_TRANSFER&to=${address}&page=1&page_size=10&sort_by=block_time&sort_order=asc`,
            solscanRequestOptions
          );
          const data11 = await res.json();
          if(!data11.data.length) {
            return ""
          }
          const data = data11.data[0];
          console.log("data11", data11.data)
          const row = `<a href="https://solscan.io/account/${address}">${shortenAddress(
            address
          )}</a>(${percent} %): <code>${simplifyNumber(
            formatUnits(data.amount, data.token_decimals)
          )} $${tokenSymbol}</code> from <a href="https://solscan.io/account/${data.from_address}">${shortenAddress(
            data.from_address
          )}</a> @ ${data.time} \n`;
          return row
        };

        return func();
      }));
      
      replyText += `Top holder fresh wallets report for ${tokenName} ($${tokenSymbol})
      
  <a href="https://solscan.io/account/${param}">$${tokenSymbol}</a> was created on ${created_time.toUTCString()}

  Fresh wallets and their respecitve funding sources :
  
`
      rows.forEach((row) => {
        replyText += row
      })
    }


    await ctx.reply(replyText, {
      parse_mode: "HTML"
    });
  } catch (error) {
    console.log("freshError", error);
    await ctx.reply("Please input correct token address.");
  }
};
