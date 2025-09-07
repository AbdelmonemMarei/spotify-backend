import { spawn } from "child_process";

export function runPython(args, res) {
  const python = spawn("python", ["python/my_spotify_script.py", ...args]);

  let data = "";
  let errorData = "";

  python.stdout.on("data", (chunk) => {
    data += chunk.toString();
  });

  python.stderr.on("data", (chunk) => {
    errorData += chunk.toString();
  });

  python.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Python script failed",
        details: errorData,
      });
    }

    try {
      const result = JSON.parse(data);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: "Failed to parse Python output",
        details: data,
      });
    }
  });
}
