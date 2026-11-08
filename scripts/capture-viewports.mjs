import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const outDir = "/opt/cursor/artifacts";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(name, viewport, reducedMotion, prepare) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3847", { waitUntil: "networkidle" });
  await prepare(page);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  await context.close();
}

await shot("north-path-career-desktop", { width: 1280, height: 900 }, "no-preference", async (page) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your next step, made clear." }).waitFor();
});

await shot("north-path-desktop", { width: 1280, height: 900 }, "no-preference", async (page) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /^Cybersecurity/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /admitted, and I do not have an associate/ }).check();
  await page.getByRole("radio", { name: /Bachelor of Science/ }).check();
  await page.getByRole("checkbox", { name: "CTS 1134 Networking Technologies" }).check();
  await page.getByRole("button", { name: "Show my path" }).click();
  await page.locator("#next-bs-via-associate").waitFor();
});

await shot("north-path-mobile", { width: 390, height: 844 }, "reduce", async (page) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /^Cybersecurity/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /admitted, and I do not have an associate/ }).check();
  await page.getByRole("radio", { name: /Bachelor of Science/ }).check();
  await page.getByRole("checkbox", { name: "CTS 1134 Networking Technologies" }).check();
  await page.getByRole("button", { name: "Show my path" }).click();
  await page.locator("#next-bs-via-associate").waitFor();
  await page.locator("[role=progressbar]").scrollIntoViewIfNeeded();
});

await browser.close();
console.log("captured");
