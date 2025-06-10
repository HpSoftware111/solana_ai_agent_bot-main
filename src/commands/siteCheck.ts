import { CommandContext } from "grammy";
import { MyContext } from "../types";
import axios from "axios";
import { config, solscanRequestOptions } from "../config";
import { isBase58SolanaWalletAddress } from "../utils";

export const siteCheck = async (ctx: CommandContext<MyContext>) => {
  const param = ctx.match;
  console.log("/siteCheck", param);
  let replyText = "";
  try {
    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?outputFormat=json&domainName=${param}&apiKey=${config.WHOIS_API}`
    );
    const data = (await response.json()).WhoisRecord;
    console.log("data", data);
    if (!data.dataError) {
      const organization = data.registrant.organization;
      const city = data.registrant.city;

      const domainsData = await (
        await fetch(`https://reverse-whois.whoisxmlapi.com/api/v2`, {
          method: "POST",
          body: JSON.stringify({
            apiKey: config.WHOIS_API,
            searchType: "current",
            mode: "purchase",
            punycode: true,
            advancedSearchTerms: [
              {
                field: "RegistrantContact.Name",
                term: data.registrant.name,
                exactMatch: true,
              },
              {
                field: "RegistrantContact.Organization",
                term: organization,
                exactMatch: true,
              },
              {
                field: "RegistrantContact.City",
                term: city,
                exclude: true,
              },
              {
                field: "RegistrantContact.Telephone",
                term: data.registrant.telephone,
                exclude: true,
              },
            ],
          }),
        })
      ).json();
      const domainsCount = domainsData.domainsCount;
      const domainsList: string[] = domainsData.domainsList;
      console.log("domain list", domainsData)

      const domainText = domainsList.slice(0, 10)
        .map((value, index) => {
          return `${index + 1}. https://${value}`;
        })
        .join("\n");

      replyText += `Similar websites found for ${param}

Found ${domainsCount} similar websites!

`;
      replyText += domainText;

      await ctx.reply(replyText, {
        parse_mode: "HTML",
      });
    } else {
      await ctx.reply("Please input correct domain.");
    }
  } catch (error) {
    console.log("siteCheckError", error);
    await ctx.reply("Please input correct domain.");
  }
};
