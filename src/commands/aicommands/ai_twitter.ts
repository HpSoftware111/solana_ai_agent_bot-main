import { Bot, Context } from "grammy";
import { config } from "../../config";
import axios from "axios";



// Handle /x command
export async function getUsernameHistory(twitter:string) {
  const twitterHandle =twitter.toString();

  if (!twitterHandle) {
    return (
      "Please provide a Twitter handle. Usage: /x twitterusername"
    );
  }

  try {
    const id = await getUserId(twitterHandle);
    const usernameHistory = await getMentionsAndTrackUsernameChanges(id);
    const usernameChangesWithDays =
      calculateDaysBetweenChanges(usernameHistory);

    // Format the response
    let response = "Username History:\n";
    usernameChangesWithDays.forEach((changes, id) => {
      response += `User ID: ${id}\n`;
      changes.forEach((change, index) => {
        response += `- ${change.username} (${change.daysSinceChange} days since last change)\n`;
      });
      response += "\n";
    });

    return  (response);
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return ("Failed to fetch mentions. Please try again later.");
  }
}

// Handle /nfl command (number of followers)
export async function getUsernameFollowerCount(twitter:string) {
  const twitterHandle =twitter.toString();

  if (!twitterHandle) {
    return(
      "Please provide a Twitter handle. Usage: /nfl twitterusername"
    );
  }

  try {
    const id = await getUserId(twitterHandle);
    const followerCount = await getFollowerCount(id);

     return  (`👥 Followers for @${twitterHandle}: ${followerCount}`);
  } catch (error) {
    console.error("Error fetching follower count:", error);
    return ("Failed to fetch follower count. Please try again later.");
  }
}

// Handle /scam command
export async function getUsernameScamStatus(twitter:string) {
  const twitterHandle =twitter.toString();

  if (!twitterHandle) {
    return (
      "Please provide a Twitter handle. Usage: /nfl twitterusername"
    );
  }

  try {
    const id = await getUserId(twitterHandle);
    // Check if the account is associated with scams
    const isScam = await isScamAccount(id);

    if (isScam) {
      return (`⚠️ Warning: This account is associated with scams.`);
    } else {
      return (
        `✅ Success: Account is not associated with any known scams.`
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return (
      "Failed to fetch the latest tweet. Please try again later."
    );
  }
}

// Handle /first command (latest tweet)
export async function getUsernameLatestTweet(twitter:string) {
  console.log("First command received");
  const twitterHandle =twitter.toString();

  if (!twitterHandle) {
    return(
      "Please provide a Twitter handle. Usage: /first twitterusername"
    );
  }

  try {
    const id = await getUserId(twitterHandle);
    const latestTweet = await getLatestTweet(id);

    if (latestTweet) {
      return  (
        `Latest tweet from user:\n\n"${latestTweet.text}"\n\nPosted on: ${latestTweet.createdAt}`
      );
    } else {
      return (`No tweets found for @${twitterHandle}.`);
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return ("Failed to fetch tweets. Please try again later.");
  }
}

/*
--------------------------------------
             UTILS
--------------------------------------
*/
export const getUserProfile = async (twitterHandle: string): Promise<any> => {
  const url = `https://api.twitter.com/2/users/by/username/${twitterHandle}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
      },
      timeout: 5000, // optional, 5 seconds timeout
    });
    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to fetch user profile for @${twitterHandle}`, error.message);
    throw new Error(`Twitter API error: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Fetches the follower count for a user.
 * @param userId - The Twitter user ID to fetch the follower count for.
 * @returns The follower count.
 */
const getFollowerCount = async (userId: string): Promise<number> => {
  const URL = `https://api.twitter.com/2/users/${userId}`;

  try {
    const response = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
      },
      params: {
        "user.fields": "public_metrics", // Include public metrics in the response
      },
    });

    const { data } = response.data;
    console.log("DATA: ", data);
    if (data && data.public_metrics) {
      return data.public_metrics.followers_count;
    } else {
      throw new Error("User data or public metrics not found.");
    }
  } catch (error) {
    console.error("Error fetching follower count:", error);
    throw new Error("Failed to fetch follower count.");
  }
};

const getUserId = async (twitterHandle: string | RegExpMatchArray) => {
  const { data } = await getUserProfile(twitterHandle.toString());
  return data.id;
};

/**
 * Fetches all mentions for a user and tracks username changes with timestamps.
 * @param userId - The Twitter user ID to fetch mentions for.
 * @returns A map of user IDs to their username changes with timestamps.
 */
const getMentionsAndTrackUsernameChanges = async (
  userId: string
): Promise<Map<string, { username: string; date: string }[]>> => {
  const URL = `https://api.twitter.com/2/users/${userId}/mentions`;
  const usernameHistory = new Map<
    string,
    { username: string; date: string }[]
  >(); // Map<userId, { username, date }[]>

  try {
    let nextToken: string | undefined;
    do {
      const response = await axios.get(URL, {
        headers: {
          Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
        },
        params: {
          max_results: 100, // Max results per request
          pagination_token: nextToken, // Pagination token for next page
          "tweet.fields": "author_id,created_at", // Include author_id and created_at in the response
          expansions: "author_id", // Include user details in the response
          "user.fields": "username", // Include username in the response
        },
      });

      const { data, includes } = response.data;

      // Process mentions
      if (data && data.length > 0) {
        for (const mention of data) {
          const authorId = mention.author_id;
          const user = includes.users.find((u: any) => u.id === authorId);

          if (user) {
            const { id, username } = user;
            const mentionDate = mention.created_at; // Timestamp of the mention

            // Update username history
            if (!usernameHistory.has(id)) {
              usernameHistory.set(id, []);
            }
            const usernames = usernameHistory.get(id)!;

            // Add username and date if it's not already in the history
            const lastEntry = usernames[usernames.length - 1];
            if (!lastEntry || lastEntry.username !== username) {
              usernames.push({ username, date: mentionDate });
            }
          }
        }
      }

      // Check for pagination
      nextToken = response.data.meta?.next_token;
    } while (nextToken); // Continue until there are no more pages

    return usernameHistory;
  } catch (error) {
    console.error("Error fetching mentions:", error);
    throw new Error("Failed to fetch mentions.");
  }
};

/**
 * Calculates the number of days between username changes.
 * @param usernameHistory - The username history with timestamps.
 * @returns A map of user IDs to their username changes with days lapsed.
 */
const calculateDaysBetweenChanges = (
  usernameHistory: Map<string, { username: string; date: string }[]>
): Map<string, { username: string; daysSinceChange: number }[]> => {
  const result = new Map<
    string,
    { username: string; daysSinceChange: number }[]
  >();

  usernameHistory.forEach((usernames, id) => {
    const changesWithDays: { username: string; daysSinceChange: number }[] = [];

    for (let i = 0; i < usernames.length; i++) {
      const current = usernames[i];
      const previous = usernames[i - 1];

      // Calculate days since the previous change
      const currentDate = new Date(current.date);
      const previousDate = previous ? new Date(previous.date) : null;
      const daysSinceChange = previousDate
        ? Math.floor(
            (currentDate.getTime() - previousDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      changesWithDays.push({ username: current.username, daysSinceChange });
    }

    result.set(id, changesWithDays);
  });

  return result;
};

/**
 * Fetches the latest tweet from a user.
 * @param userId - The Twitter user ID to fetch the latest tweet for.
 * @returns The latest tweet text and timestamp.
 */
const getLatestTweet = async (
  userId: string
): Promise<{ text: string; createdAt: string } | null> => {
  const URL = `https://api.twitter.com/2/users/${userId}/tweets`;

  try {
    const response = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
      },
      params: {
        max_results: 1, // Fetch only the latest tweet
        "tweet.fields": "created_at", // Include the timestamp of the tweet
      },
    });

    const { data } = response.data;

    if (data && data.data && data.data.length > 0) {
      const latestTweet = data.data[0];
      return {
        text: latestTweet.text,
        createdAt: latestTweet.created_at,
      };
    } else {
      return null; // No tweets found
    }
  } catch (error) {
    console.error("Error fetching latest tweet:", error);
    throw new Error("Failed to fetch latest tweet.");
  }
};

/**
 * Checks if a Twitter account is associated with scams.
 * @param userId - The Twitter user ID to check.
 * @returns True if the account is suspicious, otherwise false.
 */
const isScamAccount = async (userId: string): Promise<boolean> => {
  try {
    // Fetch user details
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
        },
        params: {
          "user.fields": "created_at,public_metrics,verified",
        },
      }
    );

    const user = userResponse.data.data;

    // Fetch recent tweets
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${config.TWITTER_BEARER_TOKEN}`,
        },
        params: {
          max_results: 10, // Fetch the last 10 tweets
          "tweet.fields": "text", // Include tweet text
        },
      }
    );

    const tweets = tweetsResponse.data.data;

    // Check account age (less than 30 days old)
    const accountAgeInDays =
      (new Date().getTime() - new Date(user.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (accountAgeInDays < 30) {
      return true; // New accounts are suspicious
    }

    // Check follower-to-following ratio
    const { followers_count, following_count } = user.public_metrics;
    if (followers_count < 10 && following_count > 100) {
      return true; // Low followers but high following count
    }

    // Check if the account is verified
    if (!user.verified) {
      return true; // Unverified accounts are more likely to be scams
    }

    // Check tweet content for spammy keywords
    const spamKeywords = [
      "free",
      "giveaway",
      "bitcoin",
      "click here",
      "win",
      "prize",
    ];
    const isSpammyContent = tweets.some((tweet: any) =>
      spamKeywords.some((keyword) => tweet.text.toLowerCase().includes(keyword))
    );
    if (isSpammyContent) {
      return true; // Spammy content detected
    }

    return false; // Account seems legitimate
  } catch (error) {
    console.error("Error checking scam account:", error);
    throw new Error("Failed to check scam account.");
  }
};
