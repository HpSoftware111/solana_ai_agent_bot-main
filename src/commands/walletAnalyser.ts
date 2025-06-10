import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions, wsol } from "../config";
import { formatTable, isBase58SolanaWalletAddress } from "../utils";

export const walletAnalyser = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/wallet_analyser", param);
  if (!isBase58SolanaWalletAddress(param)) {
    await ctx.reply("Token address is not correct");
    return;
  }
  let tableData = [
    [" Ticker", "Balance", "Buy", "Sold", "PNL"],
    ["------", "-------", "----", "-----", "----"],
  ];
  try {
    const response = await fetch(
      config.SOLSCAN_URL +
        "/account/token-accounts?type=token&address=" +
        param,
      solscanRequestOptions
    );
    const data = await response.json();
    console.log("walletAnalyserError", data);
    const tokens = data.metadata.tokens;
    const balances = data.data;
    let i = 0;
    const tokensList = [];
    for (const token in tokens) {
      if (i >= 10) break;
      tokensList.push(token);
      i++;
    }
    const requestList = tokensList.map((token, i) => {
      const func = async () => {
        const row: any = {};
        row.balance = (
          balances[i].amount /
          10 ** balances[i].token_decimals
        ).toFixed(2);
        row.name = tokens[token].token_name;
        row.symbol = tokens[token].token_symbol;

        const res = await fetch(
          `${config.SOLSCAN_URL}/account/defi/activities?activity_type[]=ACTIVITY_TOKEN_SWAP&activity_type[]=ACTIVITY_AGG_TOKEN_SWAP&address=${param}&token=${token}`,
          solscanRequestOptions
        );
        const tokenData = (await res.json()).data;
        console.log("token data", tokenData);
        let buySol = 0;
        let sellSol = 0;
        for (let index = 0; index < tokenData.length; index++) {
          const tx = tokenData[index];
          if (tx.routers.token1 == wsol) {
            buySol += tx.routers.amount1;
          }
          if (tx.routers.token2 == wsol) {
            sellSol += tx.routers.amount2;
          }
        }

        row.buySol = buySol / 1_000_000_000;
        row.sellSol = sellSol / 1_000_000_000;
        row.pnl = row.sellSol - row.buySol;
        return row;
      };
      return func();
    });
    const rows = await Promise.all(requestList);
    rows.forEach((aRow) => {
      tableData.push([
        aRow.name,
        aRow.balance,
        aRow.buySol.toFixed(2),
        aRow.sellSol.toFixed(2),
        aRow.pnl.toFixed(2),
      ]);
    });

    const formattedTable = formatTable(tableData);

    const replyText = `\`\`\`${formattedTable}\`\`\``;
    console.log("replyText", replyText);
    await ctx.reply(replyText, {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    console.log("walletAnalyserError", error);
    await ctx.reply("Please input correct wallet.");
  }
};
