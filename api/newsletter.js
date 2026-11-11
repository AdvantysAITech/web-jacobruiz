/*
  Alta en la newsletter diaria de jacobruiz.es («Un consejo al día»).

  - Reenvía el alta al Sistema Advantys por webhook. Usa NEWSLETTER_WEBHOOK_URL
    si existe y, si no, CONTACTO_WEBHOOK_URL (el mismo del formulario de contacto).
  - Etiquetas que llegan: origen-jacobruiz-es, newsletter-consejo-diario
    y el sitio de la web desde el que se apuntó (newsletter-desde-<lugar>).
  - El campo trampa «web» descarta altas de bots sin avisarles.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LUGARES = ["portada", "newsletter", "pie", "charlas", "ai-act", "libro"];

function traficoSlug(v) {
  return String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

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
  const lugar = LUGARES.indexOf(clean(body.lugar, 20)) > -1 ? clean(body.lugar, 20) : "web";

  if (!EMAIL_RE.test(email) || body.acepta !== true) {
    return res.status(422).json({ ok: false, error: "invalid" });
  }

  const trafico = traficoSlug(body.trafico);

  const payload = {
    first_name: nombre,
    full_name: nombre,
    email: email,
    motivo: "Alta en la newsletter «Un consejo al día»",
    consentimiento_newsletter: "si",
    fecha_consentimiento: new Date().toISOString(),
    tags: ["origen-jacobruiz-es", "newsletter-consejo-diario", "newsletter-desde-" + lugar].concat(trafico ? ["trafico-" + trafico] : []).join(","),
    pagina: clean(body.pagina, 200),
    origen: "web-jacobruiz-es",
    origen_trafico: trafico || "directo"
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
    console.error("[newsletter]", e.message);
    return res.status(502).json({ ok: false, error: "upstream" });
  }
};
