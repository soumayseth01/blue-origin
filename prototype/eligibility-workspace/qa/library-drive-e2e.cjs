const { chromium } = require("/Users/soumayseth/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon")) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:8999/", { waitUntil: "domcontentloaded" });
  await page.click('[data-view="library"]');
  await page.waitForSelector(".library-drive-shell");

  const initialRows = await page.locator("[data-library-row]").count();
  await page.click('[data-library-folder="Texas"]');
  const texasRows = await page.locator("[data-library-row]").count();
  await page.click('[data-library-folder="all"]');
  await page.fill("#librarySearch", "Medicaid");
  const visibleSearchRows = await page.locator('[data-library-row]:not([hidden])').count();
  await page.fill("#librarySearch", "");
  await page.click('[data-library-view="grid"]');
  const gridView = await page.locator(".library-main").evaluate((node) => node.classList.contains("grid-view"));
  await page.click('[data-library-view="list"]');
  const firstCheckbox = page.locator("[data-library-select-source]").first();
  if (await firstCheckbox.count()) await firstCheckbox.check();
  const reviewEnabled = await page.locator(".library-review-button").isEnabled();

  await page.screenshot({ path: "qa/library-drive-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobileSidebar = await page.locator("#studioSidebar").evaluate((node) => ({
    className: node.className,
    position: getComputedStyle(node).position,
    transform: getComputedStyle(node).transform,
    width: getComputedStyle(node).width,
    bounds: node.getBoundingClientRect().toJSON(),
  }));
  await page.screenshot({ path: "qa/library-drive-mobile.png" });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  console.log(JSON.stringify({ errors, initialRows, texasRows, visibleSearchRows, gridView, reviewEnabled, mobileOverflow, mobileSidebar }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
