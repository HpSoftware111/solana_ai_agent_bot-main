import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { isBase58SolanaWalletAddress, shortenAddress } from "../utils";

export const bundle = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/bundle", param);
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
    const createTx = metadata.create_tx;

    const bundleRes = await (
      await fetch(
        `https://bundles.jito.wtf/api/v1/bundles/transaction/${createTx}`
      )
    ).json();
    if (bundleRes.error) {
      replyText += `🚨 $${metadata.name} is not bundled! 🚨`;
    } else {
      const bundleId = bundleRes[0].bundle_id;
      console.log("bundleId", bundleId)

      const bundleInfo = await (
        await fetch(
          `https://bundles.jito.wtf/api/v1/bundles/bundle/${bundleId}`
        )
      ).json();
      const txns: string[] = bundleInfo[0].txSignatures;

      const rowText = (
        await Promise.all(
          txns.map((txn) => {
            const func = async () => {
              const txnData = (
                await (
                  await fetch(
                    config.SOLSCAN_URL + "/transaction/detail?tx=" + txn,
                    solscanRequestOptions
                  )
                ).json()
              ).data;
              const blockDate = new Date();
              blockDate.setTime(txnData.block_time);

              return `🟢 <a href="https://solscan.io/tx/${txn}">${shortenAddress(
                txn
              )}</a> ${blockDate.toUTCString()}`;
            };
            return func();
          })
        )
      ).join("\n");

      replyText += `🚨 $${metadata.name} is potentially bundled! 🚨

The following transactions occured in the same block when token was minted:\n
`;

      replyText += rowText;
    }

    await ctx.reply(replyText, {
        parse_mode: "HTML"
    });
  } catch (error) {
    console.log("bundleError", error);
    await ctx.reply("Please input correct token address.");
  }
};
