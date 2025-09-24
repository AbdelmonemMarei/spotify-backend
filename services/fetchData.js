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
const rapidKeys = process.env.RAPIDAPI_KEYS.split(",");

let keyIndex = 0;
// Track requests per key
let keyUsage = rapidKeys.map(() => ({
  total: 0,       // monthly usage
  timestamps: []  // per-minute timestamps
}));

const KEY_LIMIT = 120; // monthly hard-ish limit
const PER_MINUTE_LIMIT = 15;
const WINDOW_MS = 60 * 1000; // 1 min

async function getRapidKey() {
  if (rapidKeys.length === 0) {
    throw new Error("No RapidAPI keys available in .env");
  }

  let attempts = 0;
  const now = Date.now();

  while (attempts < rapidKeys.length) {
    const usage = keyUsage[keyIndex];

    // Clean old timestamps
    usage.timestamps = usage.timestamps.filter(ts => now - ts < WINDOW_MS);

    // Monthly exhausted
    if (usage.total >= KEY_LIMIT) {
      console.log(`Key[${keyIndex}] exhausted (>=${KEY_LIMIT}), removing...`);
      rapidKeys.splice(keyIndex, 1);
      keyUsage.splice(keyIndex, 1);

      if (rapidKeys.length === 0) {
        throw new Error("All RapidAPI keys exhausted for this month!");
      }

      keyIndex = keyIndex % rapidKeys.length;
      attempts++;
      continue;
    }

    // Per-minute exhausted
    if (usage.timestamps.length >= PER_MINUTE_LIMIT) {
      console.log(`Key[${keyIndex}] hit ${PER_MINUTE_LIMIT}/min, trying next...`);
      keyIndex = (keyIndex + 1) % rapidKeys.length;
      attempts++;
      continue;
    }

    // Key usable
    usage.total++;
    usage.timestamps.push(now);

    const key = rapidKeys[keyIndex];
    keyIndex = (keyIndex + 1) % rapidKeys.length; // round-robin
    return key;
  }

  // If all keys busy per-minute
  const nextReset = Math.min(
    ...keyUsage.map(u => WINDOW_MS - (now - u.timestamps[0] || 0))
  );
  console.log(`All keys busy, waiting ${nextReset}ms...`);
  await sleep(nextReset + 100);

  return getRapidKey();
}

// Simple sleep
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Get Spotify Token
async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
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

// Fetch categories
async function fetchCategories(token, market) {
  const res = await fetch(
    `https://api.spotify.com/v1/browse/categories?country=${market}&limit=56`,
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
      await sleep(1000); // 1 sec delay between category requests
      try {
        const details = await fetchCategoryDetails(cat.id);

        marketData.categories.push({
          id: cat.id,
          name: cat.name,
          content: details,
        });

        console.log(`Category fetched: ${cat.name} (${market})`);
      } catch (err) {
        console.error(`Failed to fetch category ${cat.name} (${market}):`, err.message);
      }
    }

    result.push(marketData);
  }

  fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
  return result;
}
