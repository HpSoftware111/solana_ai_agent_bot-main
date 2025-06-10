import { MyContext } from "../types"; // Adjust according to your types
import { CommandContext } from "grammy";
import { Bot } from "grammy";
import {  formatUnits,  isBase58SolanaWalletAddress, simplifyNumber,} from "../utils";
import { config, solscanRequestOptions } from "../config";
import { checkDex, topHolders,fresh, dev, walletAnalyser, bundle, commonTraders } from './aicommands/ai_tokenAddress';
import { siteCheck, domain } from "./aicommands/ai_website";
import { getUsernameHistory, getUsernameFollowerCount, getUsernameScamStatus, getUsernameLatestTweet } from './aicommands/ai_twitter';
// Function to handle the /ai command
export async function aiCommandHandler(ctx: CommandContext<MyContext>){
   const param = ctx.match;
   let summary = "📊 AI Summary Report \n\n\n\n";
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
    twitter = inputs[0].replace(/^@/, ''); // Treat the first parameter as a Twitter handle
  } else if (isBase58SolanaWalletAddress(inputs[0])) {
    tokenAddress = inputs[0];  // Treat the first parameter as a token address if it's a valid Solana address
  }

  // Check if the second parameter is a valid URL (website)
  if (inputs[1] && isValidURLorDomain(inputs[1])) {
    website = inputs[1];  // Second parameter is treated as website if valid URL
  }

  // Check if the second or third parameter is a Twitter handle
  if (inputs[1] && inputs[1].startsWith("@")) {
    twitter = inputs[1].replace(/^@/, '');  // Second parameter is treated as Twitter handle
  }
  if (inputs[2] && inputs[2].startsWith("@")) {
      twitter = inputs[2].replace(/^@/, ''); // Third parameter is treated as Twitter handle
  }
   console.log("test3.............................")
  // Call functions based on inputs
   if (tokenAddress) {
    summary += await analyzeContractAddress(tokenAddress);
  }

  if (website) {
    console.log("wesite")
    summary += await analyzeWebsite(website);
  }

  if (twitter) {
    summary += await analyzeTwitter(twitter);
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
    const holdersResult = await topHolders(tokenAddress); // Assuming topHolders is similarly structured
    const get_fresh = await fresh(tokenAddress);
    const get_dev = await dev(tokenAddress);
    const get_walletAnalyser = await walletAnalyser(tokenAddress);
    const get_bundle = await bundle(tokenAddress);
    const get_commonTraders = await commonTraders(tokenAddress);
    summary += `${dexResult}\n\n`;
    summary += `${holdersResult}\n`;
    summary += `${get_fresh}\n`;
    summary += `${get_dev}\n`;
    summary += `${get_walletAnalyser}\n`;
    summary += `${get_bundle}\n`;
    summary += `${get_commonTraders}\n`;
  } catch (e) {
    summary += `⚠️ Error fetching contract data.\n`;
    console.error("analyzeContractAddress error", e);
  }

  return summary;
}

async function analyzeWebsite(website: string): Promise<string> {
  let summary = `🌐 Website Analysis for: ${website}\n\n`
  try {
      const check_site = await siteCheck(website);
      const check_domain = await domain(website);    
      summary += `${check_site}\n\n`;
      summary += `${check_domain}\n\n`;      
      } catch (e) {
      summary += `⚠️ Error fetching contract data.\n`;
    console.error("analyzeContractAddress error", e);
  }
  return summary; 
}

async function analyzeTwitter(twitter: string): Promise<string> { 
  let summary = `🐦 Twitter Analysis for: ${twitter}}\n\n`

  try {
    const get_username_history = await getUsernameHistory(twitter);
    const get_followerCount = await getUsernameFollowerCount(twitter); 
    const get_scamStatus = await getUsernameScamStatus(twitter);
    const get_lastestTweet = await getUsernameLatestTweet(twitter);  
    summary += `${get_username_history}\n\n`;
    summary += `${get_followerCount}\n\n`;   
    summary += `${get_scamStatus}\n\n`;
    summary += `${get_lastestTweet}\n\n`;  
    
  } catch (e) {
      summary += `⚠️ Error fetching contract data.\n`;
    console.error("analyzeContractAddress error", e);
  }
  return summary; 
}

// Function to check if a string is a valid URL
function isValidURL(string: string): boolean {
  try {
    // Try to create a URL object
    const url = new URL(string);

    // Check if the protocol is valid (http, https, etc.)
    const isValidProtocol = url.protocol === "http:" || url.protocol === "https:";

    // If the protocol is valid, it's a valid URL
    if (isValidProtocol) {
      return true;
    }
    return false;
  } catch (_) {
    return false; // Not a valid URL
  }
}

function isValidDomain(string: string): boolean {
  // Use a regular expression to match domain names (e.g., example.com)
  const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}$/;
  return domainRegex.test(string);
}

function isValidURLorDomain(string: string): boolean {
  return isValidURL(string) || isValidDomain(string);
}
// website analyzer
console.log("Bot started");
