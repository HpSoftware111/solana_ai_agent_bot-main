import {  formatUnits,  isBase58SolanaWalletAddress, simplifyNumber, shortenAddress,formatTable} from "../../utils";
import { config, solscanRequestOptions, wsol,  } from "../../config";
  
export const checkDex = async (ca: String) => {
    const param = ca.toString();
    console.log("/check_dex", param)
    if(!isBase58SolanaWalletAddress(param)) {
        return ("Token address is not correct")
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
      return replyText;
    } catch (error) {
        console.log("checkDexError", error)
    }
}

export const topHolders = async (ca:String) => {
  const param = ca.toString();
  console.log("/top_holders", param);
  if (!isBase58SolanaWalletAddress(param)) {
    return ("Token address is not correct");
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
    return replyText;
  } catch (error) {
    console.log("topHolders", error);
    return ("Please input correct token address.");
  }
};
export const fresh = async (ca:String) => {
  const param = ca.toString();
  console.log("/fresh", param);
  if (!isBase58SolanaWalletAddress(param)) {
    return ("Token address is not correct");
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


    return replyText;
  } catch (error) {
    console.log("freshError", error);
    return ("Please input correct token address.");
  }
};

export const dev = async (ca:String) => {
    const param = ca.toString();
    console.log("/dev", param)
    if(!isBase58SolanaWalletAddress(param)) {
        return ("Token address is not correct");
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
        return replyText;
        
    } catch (error) {
        console.log("devError", error)
        return ("Please input correct token address.")
    }

}
export const walletAnalyser = async (ca:String) => {
  const param = ca.toString();
  console.log("/wallet_analyser", param);
  if (!isBase58SolanaWalletAddress(param)) {
    return ("Token address is not correct");
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
    return replyText;
  } catch (error) {
    console.log("walletAnalyserError", error);
    return ("Please input correct wallet.");
  }
};


export const bundle = async(ca:String) => {
  const param = ca.toString();
  console.log("/bundle", param);
  if (!isBase58SolanaWalletAddress(param)) {
    return ("Token address is not correct");
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
    return replyText;
  } catch (error) {
    console.log("bundleError", error);
    return ("Please input correct token address.");
  }
};

export const commonTraders = async (ca:String)  => {
  const messageText = ca.toString();
  const args = messageText.split(" ").slice(1); // Split by spaces and remove the command itself
  if (args.length < 1) {
    return ("Please provide 2 token addresses");
  }
  const token1 = args[0];
  const token2 = args[1];
  console.log("/commonTraders", token1, token2, args, messageText);
  if (
    !isBase58SolanaWalletAddress(token1) ||
    !isBase58SolanaWalletAddress(token2)
  ) {
    return ("Token address is not correct");
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

    const contentText = data.map((value) => {
      const address = value.from_address;
      const tx = value.trans_id;
      const txTime = new Date()
      txTime.setTime(value.block_time * 1000)
      const rowText = `🟢 Transaction: <a href="https://solscan.io/tx/${tx}">${shortenAddress(
        tx
      )}</a>   Address: <a href="https://solscan.io/address/${address}">${shortenAddress(
        address
      )}</a> at ${txTime.toUTCString()}`;
      return rowText
    }).join("\n");

    replyText += contentText

    return replyText;
  } catch (error) {
    console.log("commonTradersError", error);
    return ("Please input correct token address.");
  }
};

