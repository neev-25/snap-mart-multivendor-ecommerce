import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCTION_URL = "https://snapmart-virid.vercel.app";
const envPath = resolve(process.cwd(), ".env.local");
const raw = readFileSync(envPath, "utf8");

const vars = {};
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  vars[key] = value;
}

vars.NEXT_BASE_URL = PRODUCTION_URL;
vars.NEXTAUTH_URL = PRODUCTION_URL;

const skipEmpty = new Set(["STRIPE_WEBHOOKS_KEY"]);
const environments = ["production", "preview"];

for (const [key, value] of Object.entries(vars)) {
  if (skipEmpty.has(key) && !value.trim()) {
    console.log(`skip ${key} (empty — add after Stripe webhook setup)`);
    continue;
  }
  for (const env of environments) {
    console.log(`add ${key} → ${env}`);
    execSync(
      `npx vercel env add ${key} ${env} --value ${JSON.stringify(value)} --sensitive --yes --force`,
      { stdio: "inherit", shell: true }
    );
  }
}

console.log("Environment variables synced to Vercel.");
