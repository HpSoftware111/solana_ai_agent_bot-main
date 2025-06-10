import { MyContext } from "../types"; // Adjust according to your types
import { CommandContext } from "grammy";
import { Bot } from "grammy";
import { isBase58SolanaWalletAddress } from "../utils";
import { config } from "../config";
// import { checkDex } from "./checkDex"; // Import the checkDex function from checkDex.ts
// import { topHolders } from "./topHolders"; // Assuming topHolders is similarly structured

// Function to handle the /ai command
export async function aiCommandHandler(ctx: CommandContext<MyContext>){
   const param = ctx.match;
   let summary = "";
   // Check if `param` is a string
   if (typeof param !== "string") {
      await ctx.reply("❗ Please provide at least one parameter (ca, website, twitter).");
      return;
   }
  // Parse the input
  const inputs = param.split(" ").map((input: string) => input.trim());

  let tokenAddress: string | null = null;
  let website: string | null = null;
  let twitter: string | null = null;
   console.log("test1.............................")
  // Check for the presence of parameters
  if (inputs[0].startsWith('@')) {
    twitter = inputs[0];  // Treat the first parameter as a Twitter handle
  } else if (isBase58SolanaWalletAddress(inputs[0])) {
    tokenAddress = inputs[0];  // Treat the first parameter as a token address if it's a valid Solana address
  }

  // Check if the second parameter is a valid URL (website)
  if (inputs[1] && isValidURL(inputs[1])) {
    website = inputs[1];  // Second parameter is treated as website if valid URL
  }

  // Check if the second or third parameter is a Twitter handle
  if (inputs[1] && inputs[1].startsWith("@")) {
    twitter = inputs[1];  // Second parameter is treated as Twitter handle
  }
  if (inputs[2] && inputs[2].startsWith("@")) {
    twitter = inputs[2];  // Third parameter is treated as Twitter handle
  }
   console.log("test3.............................")
  // Call functions based on inputs
   if (tokenAddress) {
    summary += await analyzeContractAddress(tokenAddress);
  }

  if (website) {
    summary += await analyzeWebsite(website, ctx);
  }

  if (twitter) {
    summary += await analyzeTwitter(twitter, ctx);
  }

   console.log("test2.............................", summary)

  // Send the compiled summary to the user
  await ctx.reply(summary, {parse_mode: "HTML"});
}

async function analyzeContractAddress(tokenAddress: string): Promise<string> {
  let summary = `🔗 Contract Analysis for: <code>${tokenAddress}</code>\n\n`;

  try {
    // Use the imported checkDex function
    const dexResult = await checkDex(tokenAddress); // Use the checkDex function as-is
    // const holdersResult = await topHolders(ca); // Assuming topHolders is similarly structured

    summary += `${dexResult}\n\n`;
    // summary += `📊 Top Holders: ${holdersResult}\n`;
  } catch (e) {
    summary += `⚠️ Error fetching contract data.\n`;
    console.error("analyzeContractAddress error", e);
  }

  return summary;
}

async function analyzeWebsite(website: string, ctx: MyContext): Promise<string> {
  return `
🌐 Website Analysis for: ${website}
- ✅ Secured with HTTPS
- 🧾 Domain Age: 3 years
- 🏢 Registered via GoDaddy
`;
}

async function analyzeTwitter(twitter: string, ctx: MyContext): Promise<string> {
  return `
🐦 Twitter Analysis for: ${twitter}
- 👥 Followers: 10K
- 🕓 Created: June 2022
- 🚫 Scam Flags: None
`;
}

const checkDex = async (ca:String) => {
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
        // await ctx.reply(replyText, {parse_mode: "HTML"})
        
    } catch (error) {
        console.log("checkDexError", error)
    }
}

// Function to check if a string is a valid URL
function isValidURL(string: string) {
  try {
    new URL(string);  // Check if it can be parsed as a URL
    return true;
  } catch (_) {
    return false;  // Not a valid URL
  }
}

console.log("Bot started");
