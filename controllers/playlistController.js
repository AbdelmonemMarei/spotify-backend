import { runPython } from "../utils/pythonHelper.js";

export const getPlaylistDetails = (req, res) => {
  const playlistId = req.params.id;
  const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
  runPython(["playlist", playlistUrl], res);
};
