/*
  Desbloqueo del material del libro sin dar ningún dato: el lector contesta una pregunta
  del libro y, si acierta, recibe la cookie de acceso. Las respuestas solo están en el
  servidor (api/_acceso.js). Esta puerta tiene que existir siempre: el ebook dice que el
  material es «gratis y sin registro» (norma de enlaces de Kindle).
*/

const { crearCookie, respuestaCorrecta } = require("./_acceso");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }
  if (!respuestaCorrecta(body.id, body.respuesta)) {
    return res.status(200).json({ ok: false, error: "incorrecta" });
  }
  const cookie = crearCookie("pregunta");
  if (!cookie) return res.status(500).json({ ok: false, error: "not_configured" });
  res.setHeader("Set-Cookie", cookie);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true });
};
