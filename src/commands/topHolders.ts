import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  formatUnits,
  isBase58SolanaWalletAddress,
  simplifyNumber,
} from "../utils";

export const topHolders = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/top_holders", param);
  if (!isBase58SolanaWalletAddress(param)) {
    await ctx.reply("Token address is not correct");
    return;
  }
  let replyText = "";
  try {
    console.log("solscanRequestOptions", solscanRequestOptions)
    const metadata = (
      await (
        await fetch(
          config.SOLSCAN_URL + "/token/meta?address=" + param,
          solscanRequestOptions
        )
      ).json()
    ).data;
    console.log("metadata", metadata);
    const respond  = await fetch(          config.SOLSCAN_URL + "/token/meta?address=" + param,          solscanRequestOptions        )
    console.log("metadata", respond);
      
    const supply = parseInt(metadata.supply);

    const data = await (
      await fetch(
        config.SOLSCAN_URL +
          "/token/holders?page=1&page_size=30&address=" +
          param,
        solscanRequestOptions
      )
    ).json();
    console.log("data", data);
    const items: any[] = data.data.items;

    if (items.length) {
      const accountsList = await Promise.all(
        items.map((item, index) => {
          const address = item.owner;
          const amount = item.amount;
          console.log("item", item);

          const func = async () => {
            const tokensRes = await (
              await fetch(
                `${config.SOLSCAN_URL}/account/token-accounts?address=${address}&type=token&page=1&page_size=10&hide_zero=true`,
                solscanRequestOptions
              )
            ).json();
            console.log("tokensRes", tokensRes);

            const tokens: any[] = tokensRes.data;
            const tokensMetadata = tokensRes.metadata;
            const tokenStringList = await Promise.all(
              tokens.map((token) => {
                const func1 = async () => {
                  const tokenMeta = (
                    await (
                      await fetch(
                        config.SOLSCAN_URL +
                          "/token/meta?address=" +
                          token.token_address,
                        solscanRequestOptions
                      )
                    ).json()
                  ).data;
                  console.log("tokenMeta", token, tokenMeta);
                  const price = tokenMeta.price || 0;
                  const tokenValue =
                    formatUnits(token.amount, token.token_decimals) * price;
                  if (tokenValue > 15000) {
                    return `${tokenMeta.name} ($${simplifyNumber(
                      tokenValue
                    )}) `;
                  } else {
                    return "";
                  }
                };
                return func1();
              })
            );
            let tokenString = "";
            for (let index11 = 0; index11 < tokenStringList.length; index11++) {
              const element = tokenStringList[index11];
              if (index11 > 3) break;
              tokenString += element;
            }
            if (tokenString != "") {
              const accountRes = (
                await (
                  await fetch(
                    `${config.SOLSCAN_URL}/account/detail?address=${address}`,
                    solscanRequestOptions
                  )
                ).json()
              ).data;
              const solBalance = formatUnits(accountRes.lamports, 9).toFixed(1);
              const accountText = `🟢#${index + 1} <code>${address}</code>\n ${(
                (amount * 100) /
                supply
              ).toFixed(2)} % (${solBalance} SOL) | ${tokenString}`;
              return accountText;
            } else {
              return "";
            }
          };

          return func();
        })
      );
      replyText += `Noteworthy Holders for $${metadata.name}

${accountsList.filter(value => value != "").length}/30 top holders are noteworthy!\n\n`;
      replyText += accountsList.filter(value => value != "").join("\n\n");
    }
    await ctx.reply(replyText, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log("topHolders", error);
    await ctx.reply("Please input correct token address.");
  }
};
