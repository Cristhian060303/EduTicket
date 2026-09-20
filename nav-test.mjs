import puppeteer from "puppeteer-core";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3000";

const env = Object.fromEntries(
  readFileSync(".env", "utf8").split(/\r?\n/).filter((l) => /^\s*[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);

const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

// Sesion del panel, para poder recorrer /admin tambien
await browser.setCookie({
  name: "eduticket_admin",
  value: createHmac("sha256", env.ADMIN_PIN).update("eduticket-admin-v1").digest("hex"),
  domain: "localhost",
  path: "/",
});

const PAGINAS = [
  "/", "/register",
  "/books/veinte-mil-leguas", "/books/el-hobbit", "/books/enciclopedia-dinosaurios",
  "/admin", "/admin/door", "/admin/attendees", "/admin/loans", "/admin/books",
];

const fallos = [];
let clics = 0;

for (const ruta of PAGINAS) {
  await page.goto(BASE + ruta, { waitUntil: "networkidle2" });
  const estado = page.url().replace(BASE, "") || "/";

  // Cuantos enlaces internos tiene esta pagina
  const total = await page.$$eval("a[href]", (as) =>
    as.filter((a) => {
      const h = a.getAttribute("href") ?? "";
      return h.startsWith("/") || h.startsWith("#");
    }).length,
  );

  console.log(`\n${ruta}  (${total} enlaces internos, cargo en ${estado})`);

  for (let i = 0; i < total; i++) {
    await page.goto(BASE + ruta, { waitUntil: "networkidle2" });
    const enlaces = (await page.$$("a[href]")).filter(Boolean);

    const internos = [];
    for (const el of enlaces) {
      const href = await el.evaluate((a) => a.getAttribute("href") ?? "");
      if (href.startsWith("/") || href.startsWith("#")) internos.push([el, href]);
    }
    if (!internos[i]) break;

    const [el, href] = internos[i];
    const texto = (await el.evaluate((a) => a.textContent ?? "")).trim().slice(0, 28) || "(sin texto)";

    try {
      await el.click();
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      continue; // enlace tapado por otro elemento: no es un problema de ruta
    }

    clics++;
    const destino = page.url().replace(BASE, "");
    const hashes = (destino.match(/#/g) ?? []).length;
    const status = await page.evaluate(() => document.title).catch(() => "");

    if (hashes > 1) {
      fallos.push(`${ruta} -> "${texto}" (${href}) produjo ${destino}`);
      console.log(`  X  ${texto.padEnd(30)} ${href.padEnd(26)} -> ${destino}`);
    } else {
      console.log(`  ok ${texto.padEnd(30)} ${href.padEnd(26)} -> ${destino}${status ? "" : "  (sin titulo?)"}`);
    }
  }
}

console.log(`\n${clics} clics verificados`);
console.log(fallos.length === 0 ? "TODO LIMPIO: ninguna ruta acumula" : `FALLOS:\n${fallos.join("\n")}`);
await browser.close();
process.exit(fallos.length === 0 ? 0 : 1);
