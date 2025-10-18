import { runPython } from "../utils/pythonHelper.js";


export const getBatchedTracksBySearch = async (req, res) => {
  const searchQuery = req.params.query;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const result = await runPython(["search_tracks", searchQuery, offset, limit]);
    return res.json(result);
  } catch (err) {
    console.error("Error in getBatchedTracksBySearch:", err);
    return res.status(500).json({ error: err.message });
  }
};