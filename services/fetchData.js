import fetch from "node-fetch";
import fs from "fs";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const rapidKeys = process.env.RAPIDAPI_KEYS.split(",");
let keyIndex = 0;

function getRapidKey() {
  const key = rapidKeys[keyIndex];
  keyIndex = (keyIndex + 1) % rapidKeys.length;
  return key;
}

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

  const data = await res.json();
  return data.access_token;
}

async function fetchCategories(token, market) {
  const res = await fetch(
    `https://api.spotify.com/v1/browse/categories?country=${market}&limit=5`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.json();
}

async function fetchCategoryDetails(genreId) {
  const key = getRapidKey();
  const res = await fetch(
    `https://spotify-scraper.p.rapidapi.com/v1/genre/contents?genreId=${genreId}`,
    {
      headers: {
        "x-rapidapi-host": "spotify-scraper.p.rapidapi.com",
        "x-rapidapi-key": key,
      },
    }
  );
  return res.json();
}

export async function fetchAllData() {
  const token = await getSpotifyToken();
  const markets = ["EG", "US"];
  const result = [];

  for (const market of markets) {
    const categoriesData = await fetchCategories(token, market);

    const marketData = { market, categories: [] };
    for (const cat of categoriesData.categories.items) {
      const details = await fetchCategoryDetails(cat.id);
      marketData.categories.push({
        id: cat.id,
        name: cat.name,
        content: details,
      });
    }
    result.push(marketData);
  }

  fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
  return result;
}
