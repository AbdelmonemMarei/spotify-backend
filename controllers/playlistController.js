import { runPython } from "../utils/pythonHelper.js";
import { fetchPlaylistPreview } from "../utils/spotifyHelper.js";

export const getPlaylistDetails = async (req, res) => {
  const playlistId = req.params.id;
  const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;

  try {
    const result = await runPython(["playlist", playlistUrl]);
    return res.json(result);   
  } catch (err) {
    console.error("Error in getTrackDetails:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPlaylistPreview = async (req, res) => {
  const { id } = req.params;
  console.log("Fetching preview for playlist ID:", id);

  try {
    const previewTracks = await fetchPlaylistPreview(id, 5);
    console.log("Preview Tracks:", previewTracks);
    res.json(previewTracks || []);
  } catch (err) {
    console.error("Error in getPlaylistPreview:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getBatchedPlaylistDetails = async (req, res) => {
  const playlistId = req.params.id;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 5;
  const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;

  try {
    const result = await runPython(["batched_playlist", playlistUrl, offset, limit]);
    return res.json(result);
  } catch (err) {
    console.error("Error in getBatchedPlaylistDetails:", err);
    return res.status(500).json({ error: err.message });
  }
};