/*
  Entrega los archivos del material del libro solo a quien tiene la cookie de acceso
  (email o pregunta del libro). Los archivos están en libro/descargas y se incluyen en
  esta función desde vercel.json (includeFiles); la ruta pública /libro/descargas/...
  está redirigida a /libro para que no se puedan bajar sin pasar por aquí.

  GET /descargas/NOMBRE (reescrito a /api/descarga?f=NOMBRE) → el archivo, o vuelta a /libro.
  GET /api/descarga?estado=1 → { libre: true|false }, para que la página sepa si mostrar la puerta.
*/

const fs = require("fs");
const path = require("path");
const { tieneAcceso } = require("./_acceso");

const DIR = path.join(process.cwd(), "libro", "descargas");
const TIPOS = {
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  const acceso = tieneAcceso(req);

  if (req.query && req.query.estado) {
    return res.status(200).json({ libre: acceso });
  }

  const nombre = String((req.query && req.query.f) || "");
  // Solo nombres simples de los tipos permitidos (nada de rutas)
  if (!/^[A-Za-z0-9_-]+\.(pdf|zip|docx|xlsx)$/.test(nombre)) {
    return res.status(404).send("No encontrado");
  }
  if (!acceso) {
    res.setHeader("Location", "/libro?material=bloqueado#acceso");
    return res.status(302).end();
  }
  const ruta = path.join(DIR, nombre);
  let datos;
  try { datos = fs.readFileSync(ruta); } catch (e) { return res.status(404).send("No encontrado"); }
  res.setHeader("Content-Type", TIPOS[path.extname(nombre)] || "application/octet-stream");
  res.setHeader("Content-Disposition", 'attachment; filename="' + nombre + '"');
  res.setHeader("Content-Length", String(datos.length));
  return res.status(200).send(datos);
};
