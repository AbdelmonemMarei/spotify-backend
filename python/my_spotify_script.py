import sys
import json
import io
import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials
from spotify_scraper import SpotifyClient as ScraperClient

logging.disable(logging.CRITICAL)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ---------------- ENV ----------------
load_dotenv()
client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

if not client_id or not client_secret:
    raise ValueError("Spotify client_id or client_secret not found in .env")

sp = Spotify(auth_manager=SpotifyClientCredentials(
    client_id=client_id,
    client_secret=client_secret
))
scraper = ScraperClient()

# ---------------- Helpers ----------------
def fetch_scraper_track(track_id):
    """Fetch track info from scraper by ID"""
    url = f"https://open.spotify.com/track/{track_id}"
    return scraper.get_track_info(url) or {}

# ---------------- Playlist ----------------
def fetch_playlist_with_tracks(playlist_url):
    playlist_info = scraper.get_playlist_info(playlist_url)

    # Extract track IDs
    track_ids = []
    for item in playlist_info.get("tracks", []):
        track_uri = item.get("uri") or item.get("id")
        if track_uri:
            track_id = track_uri.split(":")[-1] if ":" in track_uri else track_uri
            track_ids.append(track_id)

    # Batch fetch from Spotipy
    batched_tracks = []
    for i in range(0, len(track_ids), 50):
        batch = sp.tracks(track_ids[i:i + 50])["tracks"]
        batched_tracks.extend(batch)

    # Concurrent fetch from scraper
    scraper_data = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_id = {executor.submit(fetch_scraper_track, tid): tid for tid in track_ids}
        for future in as_completed(future_to_id):
            tid = future_to_id[future]
            try:
                scraper_data[tid] = future.result()
            except Exception:
                scraper_data[tid] = {}

    # Merge data
    tracks_items = []
    for api_track in batched_tracks:
        if not api_track:
            continue

        tid = api_track["id"]
        api_album = api_track["album"]
        scraper_track = scraper_data.get(tid, {})

        preview_url = api_track["preview_url"] or scraper_track.get("preview_url")

        track_data = {
            "id": tid,
            "name": api_track["name"],
            "artists": api_track["artists"],
            "duration_ms": api_track["duration_ms"],
            "preview_url": preview_url,
            "external_urls": api_track["external_urls"],
            "is_playable": scraper_track.get("is_playable"),
            "is_explicit": scraper_track.get("is_explicit"),
            "popularity": scraper_track.get("popularity"),
            "album": {
                "id": api_album["id"],
                "name": api_album["name"],
                "release_date": api_album["release_date"],
                "total_tracks": api_album["total_tracks"],
                "images": api_album["images"],
                "external_urls": api_album["external_urls"]
            }
        }
        tracks_items.append({"track": track_data})

    return {
        "name": playlist_info.get("name"),
        "id": playlist_info.get("id"),
        "description": playlist_info.get("description"),
        "images": list(reversed(playlist_info.get("images", []))),
        "followers": playlist_info.get("followers", {}),
        "owner": playlist_info.get("owner", {}),
        "tracks": {"items": tracks_items}
    }

# ---------------- Track ----------------
def fetch_track_details(track_id):
    # Web API Using Spotipy Library and spotify-scraper
    track_data = scraper.get_track_info(f"https://open.spotify.com/track/{track_id}")
    api_track = sp.track(track_id)
    track_data['album'] = (api_track['album'])

    return track_data

def get_playlist_overview_with_tracks(playlist_id_or_url, limit=5):
    playlist_info = scraper.get_playlist_info(playlist_id_or_url)
    return playlist_info



# ---------------- Main ----------------
if __name__ == "__main__":
    if len(sys.argv) < 3:
        result = {"error": "Usage: python my_spotify_script.py <type:playlist|track> <id_or_url>"}
    else:
        action_type = sys.argv[1]
        value = sys.argv[2]
        url_prefix = "https://open.spotify.com/playlist/"

        if action_type == "playlist":
            result = fetch_playlist_with_tracks(value)
        elif action_type == "playlist_preview":
            result = get_playlist_overview_with_tracks(value)
        elif action_type == "track":
            result = fetch_track_details(value)
        else:
            result = {"error": "Unknown action type"}

    print(json.dumps(result, ensure_ascii=False, indent=2))


