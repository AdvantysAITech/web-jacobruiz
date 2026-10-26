# jacobruiz.es

Web estática (HTML, CSS y JS sin dependencias ni paso de compilación). Se despliega en Vercel tal cual.

## Páginas

| Dirección | Archivo | Notas |
| --- | --- | --- |
| `/` | `index.html` | Portada de venta: precio primero (Cumplir el AI Act 1.990 €, charla 900 €, libro), filtro de presupuesto, enlace a Advantys AI |
| `/charlas` | `charlas.html` | Charla sobre el Reglamento de IA, 900 € + IVA (también `/charla`) |
| `/libro` | `libro/index.html` | Material del libro. Anclas `#capitulo-1` a `#capitulo-17` y `#anexos` (las usan los QR del libro, no cambiarlas) |
| `/diagnostico` | `diagnostico.html` | Puente a Advantys AI: el diagnóstico ya no se vende aquí (QR del libro, no borrar) |
| `/iso-42001` | `iso-42001.html` | Paquete «Cumplir el AI Act», 1.990 € + IVA, y precio a medida de la ISO/IEC 42001 (QR del libro; también `/ai-act`) |
| `/contacto` | `contacto.html` | Contacto (QR del libro) |
| `/formulario` | `formulario.html` | Formulario, un clic detrás de las páginas anteriores. Admite `?motivo=ai-act`, `charla`, `iso-42001` o `contacto` (los antiguos `conferencia` y `diagnostico` se convierten solos). Casilla obligatoria de presupuesto salvo en «Otro asunto» |
| `/privacidad`, `/aviso-legal`, `/cookies` | `*.html` | Textos legales |

Norma de Amazon KDP: las direcciones impresas en el libro abren páginas informativas, nunca un formulario directamente.

La cabecera y el pie están repetidos en cada página: si se cambian, hay que cambiarlos en todas.

## Pendiente

| Qué | Dónde |
| --- | --- |
| Enlace a Amazon cuando el libro esté publicado | `index.html`, comentario en la tarjeta «El libro» (sustituye al botón «Muy pronto en Amazon») |
| Automatización del Sistema Advantys: nuevas etiquetas `motivo-ai-act` y `motivo-charla` y campo `presupuesto_confirmado` | webhook de `CONTACTO_WEBHOOK_URL` |
| Titular de los textos legales (propuesto: Advantys Ai, SL) | `privacidad.html`, `aviso-legal.html` |

Imágenes en `assets/img`: `jacob-ruiz.jpg` (782 × 978), `portada-libro.jpg` (1000 × 1500, de `Portada_Kindle.jpg`) y `og.jpg` (1200 × 630, para redes). Si falta alguna, la web muestra un marco neutro en su lugar.

Material del libro en `libro/descargas`: los 40 archivos y el ZIP con todo, del paquete «Pagina_de_recursos_para_subir_a_la_web.zip» de la carpeta «4 Para la web» (versión del 22 de octubre, 13:50). Si se cambia algún archivo, hay que actualizar también su tamaño en `libro/index.html`.

## Formulario

`formulario.html` envía a `/api/contacto` (`api/contacto.js`), que valida los datos y los reenvía al webhook de `CONTACTO_WEBHOOK_URL` (variable ya configurada en Vercel; recibe los datos la automatización «Web jacobruiz.es · Formulario de contacto» del Sistema Advantys) con las etiquetas `origen-jacobruiz-es` y `motivo-<motivo>`. En local el envío se simula y se ve en la consola.

## Diseño

- Tipografía Geist y Geist Mono, autoalojadas en `assets/fonts` (licencia SIL OFL).
- Iconos Phosphor (light) en `assets/icons.svg`, licencia MIT.
- Tema claro y oscuro según la preferencia del sistema. Un solo color de acento: el mostaza del libro.
- Sin cookies ni analítica (si se añaden, hay que actualizar `cookies.html` y pedir consentimiento).

## Probar en local

```
python3 -m http.server 8000
```

Las direcciones sin `.html` (por ejemplo `/diagnostico`) solo funcionan en Vercel; en local abre `diagnostico.html`.
