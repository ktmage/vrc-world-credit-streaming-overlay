import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const SERVER = process.env.SERVER ?? "http://localhost:3000";
const WORLD_ID = process.env.WORLD_ID ?? "wrld_ba913a96-fac4-4048-a062-9aa5db092812";
const OUT_DIR = "assets/screenshots";
const STYLES = ["card", "topbar"] as const;

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
try {
  for (const style of STYLES) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto(`${SERVER}/?style=${style}`, { waitUntil: "domcontentloaded" });
    // SSE EventSource が確立するまでの猶予
    await page.waitForFunction(() => document.querySelector("#world-name") !== null);
    await page.waitForTimeout(500);

    const res = await fetch(`${SERVER}/api/dev/set-world/${WORLD_ID}`, { method: "POST" });
    if (!res.ok) throw new Error(`set-world failed: ${res.status} ${await res.text()}`);

    await page.waitForFunction(
      () => {
        const img = document.querySelector<HTMLImageElement>("#thumb");
        return !!img && !img.hidden && img.complete && img.naturalWidth > 0;
      },
      { timeout: 10_000 },
    );
    // 入場アニメーション (~500ms) の終了を待つ
    await page.waitForTimeout(800);

    const out = `${OUT_DIR}/${style}.png`;
    await page.locator("#overlay").screenshot({ path: out, omitBackground: true });
    console.log(`saved ${out}`);
    await context.close();
  }
} finally {
  await browser.close();
}
