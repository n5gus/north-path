import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_URL ?? "http://127.0.0.1:3847";
const outDir = "/opt/cursor/artifacts";

async function launch(reducedMotion) {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  return { browser, context, page };
}

async function selectRadio(page, name) {
  const radio = page.getByRole("radio", { name });
  await radio.focus();
  await page.keyboard.press("Space");
  if (!(await radio.isChecked())) {
    throw new Error(`Radio was not checked: ${name}`);
  }
}

async function activateNamedButton(page, name) {
  const button = page.getByRole("button", { name });
  await button.focus();
  if (await button.isDisabled()) {
    throw new Error(`Button is disabled: ${name}`);
  }
  await page.keyboard.press("Enter");
}

async function openPath(page, { goalName, courseLabel }) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your next step, made clear." }).waitFor();
  const career = page.getByRole("radio", { name: /^Cybersecurity Mapped/ });
  await career.focus();
  await page.keyboard.press("Space");
  await activateNamedButton(page, "Continue");
  await page.getByRole("group", { name: "Where are you starting?" }).waitFor();
  await selectRadio(page, /I am admitted, and I do not have an associate degree yet/);
  await selectRadio(page, goalName);
  if (courseLabel) {
    const box = page.getByRole("checkbox", { name: courseLabel });
    await box.focus();
    await page.keyboard.press("Space");
  }
  await activateNamedButton(page, "Show my path");
  await page.getByRole("heading", { level: 1, name: /Cybersecurity|Associate|Bachelor|certificate/i }).waitFor();
}

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
  else console.log(`ok: ${message}`);
}

await mkdir(outDir, { recursive: true });

const desktop = await launch("no-preference");
try {
  await openPath(desktop.page, {
    goalName: /Bachelor of Science in Cybersecurity/,
    courseLabel: "CTS 1134 Networking Technologies",
  });
  const confirm = desktop.page.locator("#as-cts1134-confirm");
  await confirm.waitFor({ state: "attached" });
  check((await confirm.count()) === 1, "reported CTS 1134 becomes an advisor confirmation");
  check((await desktop.page.locator("#as-cts1134").count()) === 0, "reported CTS 1134 is not still an enroll step");
  check(await desktop.page.getByText("CIS 3215 Ethics in Cybersecurity").count() > 0, "bachelor path includes CIS 3215");

  const source = desktop.page.locator("#bs-admit-rule a").first();
  const href = await source.getAttribute("href");
  check(Boolean(href && href.startsWith("https://www.mdc.edu/")), `source link is an MDC url (${href})`);

  const done = desktop.page.locator("#next-bs-via-associate input[type=checkbox]");
  await done.focus();
  await desktop.page.keyboard.press("Space");
  await desktop.page.waitForFunction(() => {
    const raw = localStorage.getItem("north-path.v1");
    return Boolean(raw && JSON.parse(raw).completed.includes("next-bs-via-associate"));
  });
  await desktop.page.reload({ waitUntil: "networkidle" });
  await desktop.page.locator("#next-bs-via-associate input[type=checkbox]").waitFor();
  check(
    await desktop.page.locator("#next-bs-via-associate input[type=checkbox]").isChecked(),
    "completion survives reload",
  );

  const stageButtons = desktop.page.getByRole("button", { name: /Stage / });
  const stageCount = await stageButtons.count();
  for (let index = 0; index < stageCount; index += 1) {
    const label = await stageButtons.nth(index).innerText();
    if (label.includes("Show")) await stageButtons.nth(index).click();
  }
  await desktop.page.screenshot({
    path: "/tmp/north-path-smoke-desktop.png",
    fullPage: true,
  });

  await desktop.page.getByRole("button", { name: "Edit answers" }).click();
  await selectRadio(desktop.page, /Cybersecurity Analyst certificate first/);
  await activateNamedButton(desktop.page, "Show my path");
  await desktop.page.getByText("plan 66061").first().waitFor();
  check((await desktop.page.getByText("CIS 3215 Ethics in Cybersecurity").count()) === 0, "certificate path drops the bachelor sequence");
  check((await desktop.page.locator("#ccc-cts1134-confirm").count()) === 1, "certificate path still confirms CTS 1134");
} finally {
  await desktop.browser.close();
}

const mobile = await launch("reduce");
try {
  await mobile.page.setViewportSize({ width: 390, height: 844 });
  await openPath(mobile.page, {
    goalName: /Associate in Science in Cybersecurity/,
    courseLabel: null,
  });
  check((await mobile.page.locator("#as-cet2880c").count()) === 1, "associate path includes CET 2880C");
  check((await mobile.page.locator("#bs-cis3215").count()) === 0, "associate path omits bachelor upper division");
  const reduced = await mobile.page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  check(reduced, "reduced-motion media query is active");
  await mobile.page.getByRole("button", { name: /Stage 1/ }).focus();
  await mobile.page.keyboard.press("Enter");
  const mobileStages = mobile.page.getByRole("button", { name: /Stage / });
  const mobileCount = await mobileStages.count();
  for (let index = 0; index < mobileCount; index += 1) {
    const label = await mobileStages.nth(index).innerText();
    if (label.includes("Show")) await mobileStages.nth(index).click();
  }
  await mobile.page.screenshot({
    path: "/tmp/north-path-smoke-mobile.png",
    fullPage: true,
  });
} finally {
  await mobile.browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("smoke passed");
