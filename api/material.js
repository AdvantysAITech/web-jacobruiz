/*
  Registro de lectores para descargar el material del libro (jacobruiz.es/libro).

  - Reenvía el registro al Sistema Advantys por webhook: NEWSLETTER_WEBHOOK_URL
    si existe y, si no, CONTACTO_WEBHOOK_URL.
  - Etiquetas: origen-jacobruiz-es, lector-libro y material-libro. Solo si el lector
    marca la casilla de la newsletter se añade newsletter-consejo-diario (alta en la
    newsletter diaria, con su propio consentimiento).
  - El campo trampa «web» descarta envíos de bots sin avisarles.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || 200);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const webhook = process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACTO_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }

  if (clean(body.web)) {
    return res.status(200).json({ ok: true });
  }

  const nombre = clean(body.nombre, 80);
  const email = clean(body.email, 160).toLowerCase();
  const newsletter = body.newsletter === true;

  if (!EMAIL_RE.test(email) || body.acepta_privacidad !== true) {
    return res.status(422).json({ ok: false, error: "invalid" });
  }

  const tags = ["origen-jacobruiz-es", "lector-libro", "material-libro"];
  if (newsletter) tags.push("newsletter-consejo-diario", "newsletter-desde-libro");

  const payload = {
    first_name: nombre,
    full_name: nombre,
    email: email,
    motivo: "Registro para descargar el material del libro",
    consentimiento_newsletter: newsletter ? "si" : "no",
    fecha_consentimiento: new Date().toISOString(),
    tags: tags.join(","),
    pagina: clean(body.pagina, 200),
    origen: "web-jacobruiz-es"
  };

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error("webhook " + r.status);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[material]", e.message);
    return res.status(502).json({ ok: false, error: "upstream" });
  }
};
