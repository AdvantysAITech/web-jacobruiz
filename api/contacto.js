/*
  Recibe el formulario de jacobruiz.es/formulario y lo reenvía al Sistema Advantys.

  - La URL del webhook NO está en el código: se lee de la variable de entorno
    CONTACTO_WEBHOOK_URL (Vercel → Settings → Environment Variables).
  - Valida los datos también aquí, por si alguien llama al endpoint sin pasar por la web.
  - El campo trampa «web» descarta envíos de bots sin avisarles.
*/

const MOTIVOS = {
  "ai-act": "Paquete AI Act en regla (1.990 € + IVA)",
  charla: "Charla sobre el Reglamento de IA (900 € + IVA)",
  "iso-42001": "Certificación ISO/IEC 42001",
  contacto: "Otro asunto",
  // Antiguos, por si llega algún enlace viejo
  diagnostico: "Diagnóstico de procesos (derivar a Advantys AI)",
  conferencia: "Charla sobre el Reglamento de IA (900 € + IVA)"
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || 200);
}

function splitName(full) {
  const parts = full.split(/\s+/).filter(Boolean);
  return { first: parts.shift() || "", last: parts.join(" ") };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const webhook = process.env.CONTACTO_WEBHOOK_URL;
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

  const nombre = clean(body.nombre, 120);
  const email = clean(body.email, 160).toLowerCase();
  const empresa = clean(body.empresa, 160);
  const motivoClave = clean(body.motivo, 40);
  const motivo = MOTIVOS[motivoClave];
  const mensaje = clean(body.mensaje, 4000);

  if (!nombre || !EMAIL_RE.test(email) || !motivo || !mensaje || body.acepta_privacidad !== true) {
    return res.status(422).json({ ok: false, error: "invalid" });
  }

  const name = splitName(nombre);
  const payload = {
    first_name: name.first,
    last_name: name.last,
    full_name: nombre,
    email: email,
    company_name: empresa,
    motivo: motivo,
    mensaje: mensaje,
    fecha_consentimiento: new Date().toISOString().slice(0, 10),
    tags: ["origen-jacobruiz-es", "motivo-" + motivoClave].join(","),
    pagina: clean(body.pagina, 200),
    presupuesto_confirmado: body.presupuesto === true ? "si" : "no",
    origen: "web-jacobruiz-es"
  };

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      console.error("Webhook respondió", r.status);
      return res.status(502).json({ ok: false, error: "upstream" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error enviando al webhook", err);
    return res.status(502).json({ ok: false, error: "upstream" });
  }
};
