import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const shots = "C:/Users/LENOVO/AppData/Local/Temp/opencode";
const browser = await puppeteer.launch({ executablePath: EDGE, headless: "shell" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0", timeout: 60000 });
await page.type("#login-email", "e2e.admin@ibngroup.com");
await page.type("#login-password", "E2e!Passw0rd_2026");
await page.click("#login-submit");
await new Promise((r) => setTimeout(r, 5000));
await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const aside = document.querySelector("aside");
  const asideCls = aside ? aside.getAttribute("class") : null;
  const asideStyle = aside ? getComputedStyle(aside).position + " / " + getComputedStyle(aside).display : null;
  const header = document.querySelector("header");
  const hasSearch = !!document.querySelector('input[placeholder*="Rechercher"]');
  const kpi = [...document.querySelectorAll("p.text-2xl.font-bold")].map((e) => e.textContent?.trim());
  const banner = !!document.querySelector("img");
  const txt = document.body.innerText;
  return {
    asideClass: asideCls, asideDisplay: aside ? getComputedStyle(aside).display : null, asidePos: aside ? getComputedStyle(aside).position : null,
    headerHasSearch: hasSearch,
    kpi,
    hasImg: banner,
    hasDashboard: txt.includes("Suivi des incidents SAP"),
    hasIncidentsRecents: txt.includes("Incidents récents"),
    hasActivities: txt.includes("Dernières activités"),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: `${shots}/admin_refonte_1440.png`, fullPage: false });
await browser.close();
