import { CommandContext } from "grammy";
import { MyContext } from "../types";
import { config, solscanRequestOptions } from "../config";
import { isBase58SolanaWalletAddress, shortenAddress } from "../utils";

export const commonTopTraders = async (ctx: CommandContext<MyContext>) => {
  const messageText = ctx.message.text;
  const args = messageText.split(" ").slice(1); // Split by spaces and remove the command itself
  if (args.length < 1) {
    await ctx.reply("Please provide 2 token addresses");
    return;
  }
  const token1 = args[0];
  const token2 = args[1];
  console.log("/commonTopTraders", token1, token2, args, messageText);
  if (
    !isBase58SolanaWalletAddress(token1) ||
    !isBase58SolanaWalletAddress(token2)
  ) {
    await ctx.reply("Token address is not correct");
    return;
  }
  let replyText = "";
  try {
    const data: any[] = (
      await (
        await fetch(
          `${config.SOLSCAN_URL}/token/defi/activities?address=${token1}&activity_type[]=ACTIVITY_TOKEN_SWAP&activity_type[]=ACTIVITY_AGG_TOKEN_SWAP&token=${token2}&page=1&page_size=10&sort_by=block_time&sort_order=desc`,
          solscanRequestOptions
        )
      ).json()
    ).data;
    console.log("data", data);

    const addressList = data.map((value, index) => {
      const address = value.from_address;
      const tx = value.trans_id;
      const txTime = new Date()
      txTime.setTime(value.block_time * 1000)
      const rowText = `🟢 ${index+1} <a href="https://solscan.io/address/${address}">${(
        address
      )}</a> `;
      return rowText
    })
    const uniqueList = [... new Set(addressList)]

    replyText += uniqueList.join("\n")

    await ctx.reply(replyText, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log("commonTopTradersError", error);
    await ctx.reply("Please input correct token address.");
  }
};
