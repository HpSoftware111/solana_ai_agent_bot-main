import "dotenv/config";

export const config = {
  TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
  BOT_TOKEN: process.env.BOT_TOKEN,
  SOLSCAN_API: process.env.SOLSCAN_API,
  WHOIS_API: process.env.WHOIS_API,
  SOLSCAN_URL: "https://pro-api.solscan.io/v2.0",
  DEXSCREENER_URL: "https://api.dexscreener.com",
  SOLANA_RPC:
  "https://mainnet.helius-rpc.com/?api-key=7a23f398-7163-485f-be5a-59f68f8bdd21",
};

export const solscanRequestOptions = {
  method: "get",
  headers: { token: config.SOLSCAN_API, "Authorization": `Bearer ${config.SOLSCAN_API}`, },
};
export const wsol = "So11111111111111111111111111111111111111112";
export const sol = "So11111111111111111111111111111111111111111";
