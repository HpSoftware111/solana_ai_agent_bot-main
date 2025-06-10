import axios from "axios";

const TWITTER_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAClYyAEAAAAA55RXRB55ihOeXnJIGez2W6wD5Io%3DhxQ8G2IlrLJK903CsGWA3eW6a4RU85yDf3OoIMnKuUIH9hgGBn";

async function validateTwitterToken() {
  try {
    const response = await axios.get("https://api.twitter.com/2/users/by/username/MalyshYuri48412", {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    });

    if (response.status === 200) {
      console.log("✅ Bearer Token is valid!");
      console.log("User info:", response.data);
    } else {
      console.log("❌ Bearer Token might be invalid or limited.");
    }
  } catch (error: any) {
    console.error("❌ API validation failed:");
    console.error(error.response?.data || error.message);
  }
}

validateTwitterToken();