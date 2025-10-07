import { runPython } from "../utils/pythonHelper.js";


export const getBatchedArtistDetails = async (req, res) => {
  const artistID = req.params.id;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const result = await runPython(["batched_artist", artistID, offset, limit]);
    return res.json(result);
  } catch (err) {
    console.error("Error in getBatchedArtistDetails:", err);
    return res.status(500).json({ error: err.message });
  }
};