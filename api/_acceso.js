/*
  Acceso al material del libro (jacobruiz.es/libro).

  El lector desbloquea el material de una de dos formas: dejando su email (/api/material)
  o contestando una pregunta del libro (/api/pregunta). En los dos casos el servidor le
  pone una cookie firmada (jr_material) y solo con ella /api/descarga entrega los archivos.
  Los archivos de libro/descargas no se sirven directamente: vercel.json redirige esa ruta.

  Clave de la firma: MATERIAL_SECRET si existe en Vercel y, si no, una derivada de
  CONTACTO_WEBHOOK_URL (que ya está configurada y nunca llega al navegador).

  Las respuestas de las preguntas solo están aquí, en el servidor. Si se cambian las
  preguntas, cambiar también el texto en assets/js/site.js (mismo orden).
*/

const crypto = require("crypto");

const COOKIE = "jr_material";
const DURACION = 60 * 60 * 24 * 365; // un año

const PREGUNTAS = [
  { q: "En la conclusión, cada flujo que automatizas es «un ___ más». ¿Qué palabra falta?", a: ["ladrillo"] },
  { q: "Según el capítulo 14, ¿cuántos controles incluye el anexo de la norma ISO/IEC 42001?", a: ["38", "treinta y ocho"] },
  { q: "Según el capítulo 14, ¿en cuántas áreas se agrupan los controles de la norma ISO/IEC 42001?", a: ["9", "nueve"] }
];

function clave() {
  const base = process.env.MATERIAL_SECRET || process.env.CONTACTO_WEBHOOK_URL || process.env.NEWSLETTER_WEBHOOK_URL;
  if (!base) return null;
  return crypto.createHash("sha256").update("jr-material|" + base).digest();
}

function firma(texto, k) {
  return crypto.createHmac("sha256", k).update(texto).digest("base64url");
}

function crearCookie(via) {
  const k = clave();
  if (!k) return null;
  const caduca = Math.floor(Date.now() / 1000) + DURACION;
  const valor = "v1." + via + "." + caduca;
  return COOKIE + "=" + valor + "." + firma(valor, k) +
    "; Path=/; Max-Age=" + DURACION + "; HttpOnly; Secure; SameSite=Lax";
}

function leerCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach(function (par) {
    const i = par.indexOf("=");
    if (i > 0) out[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  });
  return out;
}

function tieneAcceso(req) {
  const k = clave();
  const c = leerCookies(req)[COOKIE];
  if (!k || !c) return false;
  const partes = c.split(".");
  if (partes.length !== 4 || partes[0] !== "v1") return false;
  const valor = partes.slice(0, 3).join(".");
  const esperada = Buffer.from(firma(valor, k));
  const recibida = Buffer.from(partes[3]);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return false;
  return Number(partes[2]) > Date.now() / 1000;
}

function normal(s) {
  return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function respuestaCorrecta(id, respuesta) {
  const p = PREGUNTAS[Number(id)];
  if (!p) return false;
  const r = normal(respuesta);
  return !!r && p.a.some(function (x) { return normal(x) === r; });
}

module.exports = { crearCookie, tieneAcceso, respuestaCorrecta, PREGUNTAS };
