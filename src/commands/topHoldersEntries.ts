import { CommandContext } from "grammy";
import { MyContext } from "../types";
import { config, solscanRequestOptions } from "../config";
import {
  formatUnits,
  isBase58SolanaWalletAddress,
  shortenAddress,
  simplifyNumber,
} from "../utils";

export const topHoldersEntries = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/top_holders_entries", param);
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
            const addressValues = await Promise.all(
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
                  return tokenValue
                };
                return func1();
              })
            );
            let addressSum = 0
            for (let index11 = 0; index11 < addressValues.length; index11++) {
              const element = addressValues[index11];
              if (index11 > 3) break;
              addressSum += element;
            }
            if (addressSum != 0) {
              const accountRes = (
                await (
                  await fetch(
                    `${config.SOLSCAN_URL}/account/detail?address=${address}`,
                    solscanRequestOptions
                  )
                ).json()
              ).data;
              const solBalance = formatUnits(accountRes.lamports, 9).toFixed(1);
              const accountText = `🟢#${index + 1}   <a href="https://solscan.io/account/${address}">${shortenAddress(address)}</a>   ${(
                (amount * 100) /
                supply
              ).toFixed(2)} %   $${simplifyNumber(addressSum)}`;
              return accountText;
            } else {
              return "";
            }
          };

          return func();
        })
      );
      replyText += `Top holders entries for <code>$${metadata.name}</code>
`;
      replyText += accountsList.filter(value => value != "").join("\n");
    }
    await ctx.reply(replyText, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log("topHoldersEntries", error);
    await ctx.reply("Please input correct token address.");
  }
};
