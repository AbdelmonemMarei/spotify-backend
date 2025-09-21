import fetch from "node-fetch";
import fs from "fs";

// markets.js
export const markets = [
  "EG", "SA", "AE", "QA",
  "US", "CA", "MX", "GB",
  "IT", "DE", "FR", "ES",
  "PT", "AR", "BR", "AU",
  "JP", "KR"
];

// Spotify Client ID and Secret
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// RapidAPI keys rotation
// RapidAPI keys rotation with per-key usage
const rapidKeys = process.env.RAPIDAPI_KEYS.split(",");

let keyIndex = 0;
// Track requests per key per minute
let keyUsage = rapidKeys.map(() => ({
  total: 0,       // total requests (monthly-ish)
  timestamps: []  // per-minute request timestamps
}));

const KEY_LIMIT = 100; // safe monthly limit
const PER_MINUTE_LIMIT = 15;
const WINDOW_MS = 60 * 1000; // 1 minute

async function getRapidKey() {
  if (rapidKeys.length === 0) {
    throw new Error("No RapidAPI keys available in .env");
  }

  let attempts = 0;

  while (attempts < rapidKeys.length) {
    const usage = keyUsage[keyIndex];

    // clean old timestamps (older than 1 min)
    const now = Date.now();
    usage.timestamps = usage.timestamps.filter(ts => now - ts < WINDOW_MS);

    // check monthly-ish total limit
    if (usage.total >= KEY_LIMIT) {
      console.log(`Key[${keyIndex}] reached ${KEY_LIMIT}, switching...`);
      keyIndex = (keyIndex + 1) % rapidKeys.length;
      attempts++;
      continue;
    }

    // check per-minute limit
    if (usage.timestamps.length >= PER_MINUTE_LIMIT) {
      const waitTime = WINDOW_MS - (now - usage.timestamps[0]);
      console.log(
        `Key[${keyIndex}] hit ${PER_MINUTE_LIMIT}/min, waiting ${waitTime}ms...`
      );
      await sleep(waitTime + 100); // wait until window clears
      continue;
    }

    // record usage
    usage.total++;
    usage.timestamps.push(now);

    return rapidKeys[keyIndex];
  }

  throw new Error("All RapidAPI keys exhausted or rate-limited!");
}

// Simple sleep for rate limiting
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get Spotify Token
async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
          "base64"
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify Auth Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Fetch categories from Spotify
async function fetchCategories(token, market) {
  const res = await fetch(
    `https://api.spotify.com/v1/browse/categories?country=${market}&limit=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Spotify Categories Error (${market}): ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// Fetch category details from RapidAPI
async function fetchCategoryDetails(genreId) {
  const key = await getRapidKey();
  const res = await fetch(
    `https://spotify-scraper.p.rapidapi.com/v1/genre/contents?genreId=${genreId}`,
    {
      headers: {
        "x-rapidapi-host": "spotify-scraper.p.rapidapi.com",
        "x-rapidapi-key": key,
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      `RapidAPI Genre Error (${genreId}): ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// Main function
export async function fetchAllData() {
  const token = await getSpotifyToken();
  const result = [];

  for (const market of markets) {
    console.log(`Fetching categories for market: ${market}`);
    const categoriesData = await fetchCategories(token, market);

    const marketData = { market, categories: [] };

    for (const cat of categoriesData.categories.items) {
      await sleep(1000); // 1 second delay between category requests
      const details = await fetchCategoryDetails(cat.id);

      marketData.categories.push({
        id: cat.id,
        name: cat.name,
        content: details,
      });

      console.log(`✅ Category fetched: ${cat.name} (${market})`);
    }

    result.push(marketData);
  }

  fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
  return result;
}
