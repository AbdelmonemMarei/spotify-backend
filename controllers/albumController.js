import { runPython } from "../utils/pythonHelper.js";


export const getBatchedAlbumDetails = async (req, res) => {
  const albumID = req.params.id;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const result = await runPython(["batched_album", albumID, offset, limit]);
    return res.json(result);
  } catch (err) {
    console.error("Error in getBatchedAlbumDetails:", err);
    return res.status(500).json({ error: err.message });
  }
};