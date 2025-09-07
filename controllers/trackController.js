import { runPython } from "../utils/pythonHelper.js";

export const getTrackDetails = (req, res) => {
  const trackId = req.params.id;
  runPython(["track", trackId], res);
};
