import puppeteer from "puppeteer";

const TOK = process.argv[2];
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.setCookie({ name: "tms_session", value: TOK, domain: "tmslist.com", path: "/", secure: true, httpOnly: true, sameSite: "Lax" });

const apiCalls = [];
page.on("response", async (r) => {
  const url = r.url();
  if (url.includes("/api/")) {
    apiCalls.push({ url: url.replace("https://tmslist.com", ""), status: r.status() });
  }
});

const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

const pages = ["dashboard", "clinic", "reviews", "leads", "jobs", "analytics", "health", "settings"];
for (const p of pages) {
  apiCalls.length = 0;
  consoleErrors.length = 0;
  console.log(`\n=== /portal/${p}/ ===`);
  await page.goto(`https://tmslist.com/portal/${p}/`, { waitUntil: "networkidle2", timeout: 25000 }).catch(e => console.log("  nav err:", e.message));
  // Wait extra for any client-side fetches
  await new Promise(r => setTimeout(r, 1500));
  console.log("  API calls:");
  apiCalls.forEach(c => console.log(`    ${c.status} ${c.url}`));
  if (consoleErrors.length) {
    console.log("  console errors:");
    consoleErrors.slice(0,5).forEach(e => console.log(`    ✖ ${e.slice(0,150)}`));
  }
  // Inspect main content
  const bodyText = await page.evaluate(() => {
    const main = document.querySelector("main");
    return main ? main.innerText.slice(0, 200) : "(no main)";
  });
  console.log(`  main excerpt: ${JSON.stringify(bodyText.slice(0, 150))}`);
}

await browser.close();
