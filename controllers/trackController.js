import { runPython } from "../utils/pythonHelper.js";

export const getTrackDetails = async (req, res) => {
  const trackId = req.params.id;
  console.log("Fetching details for track ID:", trackId);

  try {
    const result = await runPython(["track", trackId]);
    return res.json(result);   
  } catch (err) {
    console.error("Error in getTrackDetails:", err);
    return res.status(500).json({ error: err.message });
  }
};
