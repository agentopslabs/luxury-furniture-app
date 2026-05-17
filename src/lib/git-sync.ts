import { execSync } from "child_process";

const REPO_URL = "https://github.com/agentopslabs/luxury-furniture-app.git";

export function gitSync(message: string, files: string[] = []) {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[git-sync] GITHUB_PERSONAL_ACCESS_TOKEN not set, skipping sync.");
    return;
  }

  try {
    const cwd = process.cwd();
    const remoteWithToken = REPO_URL.replace("https://", `https://${token}@`);

    const addTargets = files.length > 0 ? files.join(" ") : "-A";
    execSync(`git add ${addTargets}`, { cwd, stdio: "pipe" });

    const diff = execSync("git diff --cached --name-only", { cwd, stdio: "pipe" }).toString().trim();
    if (!diff) {
      console.log("[git-sync] Nothing to commit, skipping push.");
      return;
    }

    execSync(
      `git -c user.email="auto-sync@luxuryfurniture.app" -c user.name="LuxuryFurniture App" commit -m "${message}"`,
      { cwd, stdio: "pipe" }
    );

    execSync(`git push ${remoteWithToken} main`, { cwd, stdio: "pipe" });
    console.log(`[git-sync] Pushed: ${message}`);
  } catch (err: any) {
    console.error("[git-sync] Failed:", err?.message || err);
  }
}
