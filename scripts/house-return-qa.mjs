#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const notes = [];

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));

  await page.goto(`${base}/architecture`, { waitUntil: "networkidle", timeout: 45000 });
  const house = page.getByRole("link", { name: /The site/i });
  notes.push({ step: "chrome", hasHouseLink: (await house.count()) > 0 });

  const weeknight = page.getByRole("button", { name: /Weeknight for six/i });
  if (await weeknight.count()) {
    await weeknight.click();
    await page.waitForTimeout(1400);
  }

  const body = await page.locator("body").innerText();
  notes.push({
    step: "architecture-return",
    hasDesk: /This plan has a reading desk/i.test(body),
    hasContinue: /Continue on saltnotes\.blog/i.test(body),
    hasLast30: /Last 30 Minutes/i.test(body),
    hasSiteLink: /saltnotes\.blog/i.test(body),
  });
  await page.screenshot({ path: "/workspace/screenshots/house-return-architecture.png", fullPage: true });

  const continueBtn = page.getByRole("button", { name: /Continue on saltnotes\.blog/i });
  if (await continueBtn.count()) {
    const opened = [];
    page.context().on("page", (p) => opened.push(p.url()));
    await continueBtn.click();
    await page.waitForTimeout(600);
    notes.push({ step: "open-desk", opened });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/workspace/screenshots/house-return-mobile.png", fullPage: false });

  writeFileSync("/workspace/screenshots/house-return-qa.json", JSON.stringify({ notes, consoleErrors, pageErrors }, null, 2));
  console.log(JSON.stringify({ notes, consoleErrors, pageErrors }, null, 2));
  if (pageErrors.length || consoleErrors.some((e) => !/favicon|Download the React DevTools/i.test(e))) {
    process.exitCode = 2;
  }
} finally {
  await browser.close();
}
