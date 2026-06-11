import type { APIRoute } from 'astro';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export const prerender = false;

export const POST: APIRoute = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(__dirname, "../..");
  const scriptPath = resolve(projectRoot, "scripts/sync.py");
  
  return new Promise((resolve) => {
    const proc = spawn("python3", [scriptPath], {
      cwd: projectRoot,
      env: { ...process.env, VIRTUAL_ENV: resolve(projectRoot, ".venv") },
    });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    
    proc.on("close", (code) => {
      resolve(new Response(JSON.stringify({
        status: code === 0 ? "ok" : "error",
        message: stdout || stderr || `Exited with code ${code}`,
      }), {
        headers: { "Content-Type": "application/json" },
        status: code === 0 ? 200 : 500,
      }));
    });
  });
};