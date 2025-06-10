import "dotenv/config";

require("dotenv").config();

import {
  Bot,
  InlineKeyboard,
  InputFile,
  Context,
  session,
  SessionFlavor,
  BotError,
  NextFunction,
  GrammyError,
  HttpError,
} from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { config } from "./src/config";
import { MyContext, MyConversation, SessionData } from "./src/types";
import { pingpongCmd } from "./src/commands/ping";
import { checkDex } from "./src/commands/checkDex";
import { topHolders } from "./src/commands/topHolders";
import { dev } from "./src/commands/dev";
import { walletAnalyser } from "./src/commands/walletAnalyser";
import { fresh } from "./src/commands/fresh";
import { funded } from "./src/commands/funded";
import { topHoldersFloor } from "./src/commands/topHoldersFloor";
import { bundle } from "./src/commands/bundle";
import { commonTraders } from "./src/commands/commonTraders";
import { guide } from "./src/commands/guide";
import { holdersScan } from "./src/commands/holdersScan";
import { domain } from "./src/commands/domain";
import { graduate } from "./src/commands/graduate";
import { topHoldersEntries } from "./src/commands/topHoldersEntries";
import { commonTopTraders } from "./src/commands/commonTopTraders";
import { reverseImageSearch } from "./src/commands/reverseImageSearch";
import { siteCheck } from "./src/commands/siteCheck";
import {
  getUsernameFollowerCount,
  getUsernameHistory,
  getUsernameLatestTweet,
  getUsernameScamStatus,
} from "./src/commands/twitter";

import { aiCommandHandler } from "./src/commands/aiCommand";

// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return {
    token: "",
  };
}

const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.use(
  session({
    initial: initial,
  })
);

bot.use(conversations());
bot.use(createConversation(startBot));

const supportKeyBoard = new InlineKeyboard().url(
  " 🌎 Support ",
  `${config.BOT_TOKEN}`
);

// Send a keyboard along with a message.
bot.command("start", async (ctx) => {
  const param = ctx.match;
  console.log("/start", param);
  ctx.session = initial();
  await replyWithMain(ctx, param);
});

// Send a keyboard along with a message.
bot.command("restart", async (ctx) => {
  const param = ctx.match;
  console.log("/restart", param);
  ctx.session = initial();
  await replyWithMain(ctx, param);
});

bot.command("ping", pingpongCmd);

bot.command("check_dex", checkDex);
bot.command("dex", checkDex);

bot.command("top", topHolders);
bot.command("top_holders", topHolders);

bot.command("entries", topHoldersEntries);
bot.command("top_holders_entries", topHoldersEntries);

bot.command("top_holders_floor", topHoldersFloor);
bot.command("floor", topHoldersFloor);

bot.command("wallet", walletAnalyser);
bot.command("wallet_analyser", walletAnalyser);

bot.command("fresh", fresh);

bot.command("funded", funded);

bot.command("dev", dev);

bot.command("holders", holdersScan);
bot.command("holderscan", holdersScan);

bot.command("common_traders", commonTraders);

bot.command("common_top_traders", commonTopTraders);

bot.command("bundle", bundle);
bot.command("bundle_check", bundle);

bot.command("guide", guide);

bot.command("domain", domain);

bot.command("site_check", siteCheck);
bot.command("site", siteCheck);

bot.command("reverse_image_search", reverseImageSearch);
bot.command("image", reverseImageSearch);

bot.command("stats", graduate);
bot.command("graduated_stats", graduate);

// Twitter commands
bot.command("x", getUsernameHistory);
bot.command("twitter_reuse", getUsernameHistory);

bot.command("nfl", getUsernameFollowerCount);
bot.command("notable_followers", getUsernameFollowerCount);

bot.command("first", getUsernameLatestTweet);

bot.command("scam", getUsernameScamStatus);

// Handle the /ai command
bot.command("ai", aiCommandHandler);


async function replyWithMain(ctx: MyContext, param: string) {
  const params = param.split("_");
  const refCode = params[0];
  const adCode = params[1] || "";

  await ctx.conversation.enter("startBot");
}

async function startBot(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(`Welcome to AI Agent, get started using the commands below:

1. /ping  
Reason: Ensures the bot's operational status, essential for reliability.

2. /guide  
Reason: Provides users with instructions to access the bot's functionalities.

3. /check_dex or /dex [contract-address]  
Reason: Directly checks for updates in decentralized exchanges (DEXs) for tokens, crucial for trading insights.

4. /top_holders or /top [contract-address]  
Reason: Core feature to analyze token holder distribution, crucial for understanding token dynamics.

5. /wallet_analyzer or /wallet [wallet-address]  
Reason: Offers wallet trading history, valuable for user-specific insights.

6. /holderscan or /holders [contract-address]  
Reason: Fetches detailed token holder information, relevant for token analytics.

7. /fresh [contract-address]  
Reason: Identifies new wallets holding tokens, providing early trend signals.

8. /funded [wallet-address]  
Reason: Analyzes wallet funding history, helpful in detecting origins of activity.

9. /top_holders_floor or /floor [contract-address]  
Reason: Tracks top holder floor data, useful for pricing insights.

10. /bundle_check or /bundle [contract-address]  
Reason: Checks if a token is bundled, relevant for determining token complexities.

11. /common_traders [contract-address] [contract-address]...  
Reason: Finds common traders between tokens, helpful in analyzing trading patterns.

12. /dev [contract-address]  
Reason: Tracks token creation history for a contract address, providing critical background.

13. /twitter_reuse or /x [twitter-handle]  
Reason: Involves Twitter data, not specific to Solana.

14. /notable_followers or /nfl [username]  
Reason: Requires external platform (Twitter) integration.

15. /scam [twitter-handle]  
Reason: Requires Twitter data scraping, tangential to Solana-specific requirements.

16. /first [twitter-handle]  
Reason: Twitter data fetching isn't central to Solana insights.

17. /ai (ca)  
Reason: Generates AI-based summary and sentiment analysis of the contract address (ca), useful for understanding token behavior.

18. /ai (ca) (Twitter)  
Reason: Enhances token insights by incorporating official Twitter signals for social sentiment and news relevance.

19. /ai (ca) (website)  
Reason: Combines token data with content from its official website to better assess legitimacy and use-case.

20. /ai (ca) (Twitter) (website)  
Reason: Combines smart contract, Twitter, and website content to provide a full-spectrum AI analysis.

21. /ai (Twitter)  
Reason: Analyzes only the Twitter profile using AI to determine reputation, activity, and relevance.

22. /ai (website)  
Reason: Parses and evaluates the provided website using AI for legitimacy, structure, and potential red flags.

23. /ai (Twitter) (website)  
Reason: Leverages both Twitter and website sources to give a consolidated AI-based assessment for due diligence.
`);
}

bot.on("callback_query:data", async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  switch (callbackData.type) {
    case "click-choose-plan":
      await ctx.conversation.exit("startBot");
      await ctx.conversation.enter("askForPoolType");
      break;
    case "click-refer":
      await ctx.conversation.exit("startBot");
      await ctx.conversation.enter("referral");
      break;
    default:
      await ctx.answerCallbackQuery("Unknown option");
      await ctx.reply("This option is not recognized.");
      break;
  }
});

// Wait for click events with specific callback data.
bot.command("click-cancel", async (ctx) => {
  await replyWithMain(ctx, undefined);
});

bot.catch((err) => {
  console.log(err);
  const ctx = err.ctx;

  ctx
    .reply(
      `⚠️ Bot has hit an issue.\n\nUse the 'start' option in the 'Menu' to try again.`,
      {
        reply_markup: supportKeyBoard,
        parse_mode: "HTML",
      }
    )
    .then();

  console.error(`Error while handling update ${ctx.update.update_id}:`);

  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram: or Backdne", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.api.setMyCommands([{ command: "start", description: "Start menu" }]);
// Start the bot.
bot.start();

console.log("Bot started");

export const asyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
