import puppeteer from "puppeteer";

const TOK = process.argv[2];
if (!TOK) { console.error("usage: node probe-sidebar.mjs <token>"); process.exit(1); }

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const consoleErrors = [];
const failed = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => failed.push(r.url() + " — " + r.failure()?.errorText));

const cookie = { name: "tms_session", value: TOK, domain: "tmslist.com", path: "/", secure: true, httpOnly: true, sameSite: "Lax" };
await page.setCookie(cookie);

console.log("→ GET /portal/dashboard/");
const resp = await page.goto("https://tmslist.com/portal/dashboard/", { waitUntil: "networkidle2", timeout: 30000 });
console.log("  status:", resp.status(), "url:", page.url());

// Get all sidebar links
const sidebarLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('aside a, nav a'));
  return links
    .filter(a => a.href.includes('/portal/') || a.href.endsWith('/community') || a.href.includes('/community/'))
    .map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().slice(0, 30),
      hasClickHandler: !!a.onclick,
      computedDisplay: getComputedStyle(a).display,
      pointerEvents: getComputedStyle(a).pointerEvents,
      visibility: getComputedStyle(a).visibility,
    }));
});
console.log("Sidebar links found:", sidebarLinks.length);
console.table(sidebarLinks);

// Now test clicking each one
const targets = ['Dashboard', 'Edit Clinic', 'Reviews', 'Leads', 'Jobs', 'Analytics', 'Health Score', 'Community', 'Settings'];
for (const label of targets) {
  // Re-navigate to dashboard so each click starts fresh
  await page.goto("https://tmslist.com/portal/dashboard/", { waitUntil: "domcontentloaded", timeout: 20000 });
  // Use evaluate to click since some links may be in a hidden mobile drawer
  const clicked = await page.evaluate((label) => {
    const links = Array.from(document.querySelectorAll('a'));
    const target = links.find(a => a.textContent.trim() === label);
    if (!target) return { found: false };
    return { found: true, href: target.href, rect: target.getBoundingClientRect().toJSON() };
  }, label);
  if (!clicked.found) {
    console.log(`  "${label}": LINK NOT FOUND`);
    continue;
  }
  // Actually click it
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null),
      page.evaluate((label) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find(a => a.textContent.trim() === label);
        target?.click();
      }, label),
    ]);
    console.log(`  "${label}": → ${page.url()} (status seen earlier)`);
  } catch (e) {
    console.log(`  "${label}": ERROR ${e.message}`);
  }
}

console.log("\nConsole errors during run:", consoleErrors.length);
consoleErrors.slice(0, 10).forEach(e => console.log("  ✖", e.slice(0, 200)));
console.log("\nFailed requests:", failed.length);
failed.slice(0, 10).forEach(f => console.log("  ✖", f.slice(0, 200)));

await browser.close();
