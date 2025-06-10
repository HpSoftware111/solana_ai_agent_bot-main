import { MyContext } from "../../types"; // Adjust according to your types
import { CommandContext } from "grammy";
import { Bot } from "grammy";
import {  formatUnits,  isBase58SolanaWalletAddress, simplifyNumber,} from "../../utils";
import { config, solscanRequestOptions } from "../../config";

export const siteCheck = async (website:string) => {
  const param = website.toString();
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
      return replyText;
    } else {
      return ("Please input correct domain.");
    }
  } catch (error) {
    console.log("siteCheckError", error);
    return ("Please input correct domain.");
  }
};

export const domain = async (website:string) => {
  const param = website.toString();
  console.log("/domain", param);
  let replyText = "";
  try {
    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?outputFormat=json&domainName=${param}&apiKey=${config.WHOIS_API}`
    );
    const data = (await response.json()).WhoisRecord;
    console.log("data", data);
    if (!data.dataError) {
      const registrarName = data.registrarName;
      const createdDate = data.registryData.createdDate;
      const expiresDate = data.registryData.expiresDate;
      replyText += `<code>${param}</code> is registered on <code>${registrarName}</code> \n Created Date: <code>${createdDate}</code> \n Expires Date: <code>${expiresDate}</code>\n`;

      return replyText;
    } else {
      return ("Please input correct domain.");
    }
  } catch (error) {
    console.log("domainError", error);
    return ("Please input correct domain.");
  }
};