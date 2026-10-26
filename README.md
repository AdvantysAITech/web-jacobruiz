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
| `/newsletter` | `newsletter.html` | Alta en la newsletter diaria «Un consejo al día» (también `/consejo`) |
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

## Newsletter «Un consejo al día»

Hay tres formularios de alta: la sección de la portada (`#newsletter`), la página `/newsletter` y la franja del pie, que sale en todas las páginas. Los tres envían a `/api/newsletter` (`api/newsletter.js`), que valida y reenvía al webhook de `NEWSLETTER_WEBHOOK_URL` o, si esa variable no existe, al de `CONTACTO_WEBHOOK_URL`.

Datos que llegan: `first_name` (opcional), `email`, `consentimiento_newsletter: "si"`, `fecha_consentimiento` (fecha y hora ISO), `pagina` y las etiquetas `origen-jacobruiz-es`, `newsletter-consejo-diario` y `newsletter-desde-<portada|newsletter|pie>`.

Automatización que hay que montar en el Sistema Advantys:

1. Disparador: entra un contacto con la etiqueta `newsletter-consejo-diario`.
2. Enviar en el momento el email de bienvenida (lo prepara Jacob con Claude). El formulario le dice al usuario que lo acaba de recibir.
3. El contacto entra en la lista «Newsletter diaria», que recibe un envío al día a la misma hora (propuesta: 7:30, hora de Madrid). Cada envío diario lo programa Jacob después de revisarlo.
4. Todos los emails llevan enlace de baja de un clic y los datos del remitente. Quien se da de baja pierde la etiqueta y sale de la lista.
5. Remitente: Jacob Ruiz, con un buzón de jacobruiz.es. El dominio necesita SPF, DKIM y DMARC configurados antes del primer envío, o los emails acabarán en spam.

El formulario de contacto no apunta a nadie a la newsletter: son consentimientos distintos.
