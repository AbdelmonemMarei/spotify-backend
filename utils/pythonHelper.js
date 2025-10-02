import { spawn } from "child_process";

export function runPython(args = []) {
  return new Promise((resolve, reject) => {
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
        return reject(new Error(errorData || "Python script failed"));
      }
      try {
        const result = JSON.parse(data);
        resolve(result);
      } catch (err) {
        reject(new Error("Failed to parse Python output: " + data));
      }
    });
  });
}
