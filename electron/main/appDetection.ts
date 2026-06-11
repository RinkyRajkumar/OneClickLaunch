import fs from "node:fs";
import path from "node:path";
import type { DetectedApp } from "../../src/types";

type Candidate = { id: string; name: string; paths: string[] };

const env = process.env;
const local = env.LOCALAPPDATA ?? "";
const roaming = env.APPDATA ?? "";
const programFiles = env.ProgramFiles ?? "C:\\Program Files";
const programFilesX86 = env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";

function discordExecutables() {
  const root = path.join(local, "Discord");
  try {
    return fs.readdirSync(root)
      .filter((entry) => entry.startsWith("app-"))
      .sort()
      .reverse()
      .map((entry) => path.join(root, entry, "Discord.exe"));
  } catch {
    return [];
  }
}

const candidates: Candidate[] = [
  { id: "chrome", name: "Google Chrome", paths: [path.join(programFiles, "Google\\Chrome\\Application\\chrome.exe"), path.join(programFilesX86, "Google\\Chrome\\Application\\chrome.exe"), path.join(local, "Google\\Chrome\\Application\\chrome.exe")] },
  { id: "edge", name: "Microsoft Edge", paths: [path.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"), path.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe")] },
  { id: "firefox", name: "Mozilla Firefox", paths: [path.join(programFiles, "Mozilla Firefox\\firefox.exe"), path.join(programFilesX86, "Mozilla Firefox\\firefox.exe")] },
  { id: "vscode", name: "Visual Studio Code", paths: [path.join(local, "Programs\\Microsoft VS Code\\Code.exe"), path.join(programFiles, "Microsoft VS Code\\Code.exe")] },
  { id: "discord", name: "Discord", paths: [...discordExecutables(), path.join(local, "Discord\\Update.exe")] },
  { id: "steam", name: "Steam", paths: [path.join(programFilesX86, "Steam\\steam.exe"), path.join(programFiles, "Steam\\steam.exe")] },
  { id: "spotify", name: "Spotify", paths: [path.join(roaming, "Spotify\\Spotify.exe"), path.join(local, "Microsoft\\WindowsApps\\Spotify.exe")] },
  { id: "notepad", name: "Notepad", paths: [path.join(env.WINDIR ?? "C:\\Windows", "System32\\notepad.exe")] },
  { id: "word", name: "Microsoft Word", paths: [path.join(programFiles, "Microsoft Office\\root\\Office16\\WINWORD.EXE"), path.join(programFilesX86, "Microsoft Office\\root\\Office16\\WINWORD.EXE")] },
  { id: "excel", name: "Microsoft Excel", paths: [path.join(programFiles, "Microsoft Office\\root\\Office16\\EXCEL.EXE"), path.join(programFilesX86, "Microsoft Office\\root\\Office16\\EXCEL.EXE")] },
  { id: "powerpoint", name: "Microsoft PowerPoint", paths: [path.join(programFiles, "Microsoft Office\\root\\Office16\\POWERPNT.EXE"), path.join(programFilesX86, "Microsoft Office\\root\\Office16\\POWERPNT.EXE")] }
];

export function detectApps(): DetectedApp[] {
  return candidates.map((candidate) => {
    const executablePath = candidate.paths.find((candidatePath) => fs.existsSync(candidatePath)) ?? candidate.paths[0];
    return {
      id: candidate.id,
      name: candidate.name,
      executablePath,
      detected: candidate.paths.some((candidatePath) => fs.existsSync(candidatePath))
    };
  });
}
