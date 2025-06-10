import { CommandContext, InputFile } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config } from "../config";
import { isBase58SolanaWalletAddress } from "../utils";
import puppeteer from "puppeteer";

export const reverseImageSearch = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/reverse_image_search", param);
  let replyText = "";
  try {
    const paramObj = {
      q: param,
      newwindow: "1",
      source: "hp",
      biw: "1366",
      bih: "768",
      uact: "5",
      oq: param,
      sclient: "img",
      udm: "2",
    };
    const searchParams = new URLSearchParams(paramObj);
    const date = new Date();
    const mainParamObj = {
        apiKey: config.WHOIS_API,
        type: "png",
        url: `https://www.google.com/search?${searchParams.toString()}`
    }
    const mainSearchParams = new URLSearchParams(mainParamObj)

    const buffer = await fetch(`https://website-screenshot.whoisxmlapi.com/api/v1?${mainSearchParams.toString()}`);
    const arrayBuffer = await buffer.arrayBuffer();
    await ctx.replyWithPhoto(new InputFile(new Uint8Array(arrayBuffer)))
  } catch (error) {
    console.log("reverseImageSearchError", error);
  }
};
