import { runPython } from "./pythonHelper.js";

export const fetchPlaylistPreview = async (playlistId, limit = 5) => {
  try {
    const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
    const playlistData = await runPython(["playlist_preview", playlistUrl]);

    return playlistData

  } catch (err) {
    console.error("Error in fetchPlaylistPreview:", err);
    return [];
  }
};
