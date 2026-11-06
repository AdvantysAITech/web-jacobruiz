# jacobruiz.es

Web estática (HTML, CSS y JS sin dependencias ni paso de compilación). Se despliega en Vercel tal cual.

## Páginas

| Dirección | Archivo | Notas |
| --- | --- | --- |
| `/` | `index.html` | Portada de venta: precio primero (Cumplir el AI Act 3.900 €, charla 900 €, libro), filtro de presupuesto, enlace a Advantys AI |
| `/charlas` | `charlas.html` | Charla sobre el Reglamento de IA, 900 € + IVA (también `/charla`) |
| `/libro` | `libro/index.html` | Material del libro (indexable desde el 1 de noviembre de 2026: es la página que sale en Google al buscar el título; arriba lleva el bloque «Compra mi libro»). Anclas `#capitulo-1` a `#capitulo-17` y `#anexos` (las usan los QR del libro, no cambiarlas). Descargas bloqueadas de verdad: el lector se registra (`/api/material`) o contesta una pregunta del libro (`/api/pregunta`, respuestas solo en el servidor) y recibe una cookie firmada; los archivos se bajan por `/descargas/NOMBRE` (`/api/descarga`), que sin esa cookie devuelve a `/libro`. La ruta directa `/libro/descargas/...` está redirigida |
| `/diagnostico` | `diagnostico.html` | Puente a Advantys AI: el diagnóstico ya no se vende aquí (QR del libro, no borrar) |
| `/cumplimiento-ai-act` | `cumplimiento-ai-act.html` | Paquete «Cumplir el AI Act», 3.900 € + IVA (también `/ai-act`, `/cumplir-ai-act`) |
| `/iso-42001` | `iso-42001.html` | Implantación y auditoría interna ISO/IEC 42001, precio a medida (QR del libro: arriba lleva un aviso con enlace al paquete de 3.900 € y al capítulo 14, no quitarlo) |
| `/guia` | `guia/index.html` | Guía del AI Act: índice de las 8 guías de `guia/*.html` (contenido para SEO) |
| `/noticias` | `noticias/*.html` (generado) | «Actualidad del AI Act»: una noticia comentada cada semana. No se edita a mano: se escribe en `herramientas/noticias/articulos/` y se genera con `herramientas/noticias/publicar.py` (ver más abajo) |
| `/newsletter` | `newsletter.html` | Alta en la newsletter diaria «Un consejo al día» (también `/consejo`) |
| `/contacto` | `contacto.html` | Contacto (QR del libro) |
| `/formulario` | `formulario.html` | Formulario, un clic detrás de las páginas anteriores. Admite `?motivo=ai-act`, `charla`, `iso-42001` o `contacto` (los antiguos `conferencia` y `diagnostico` se convierten solos). Casilla obligatoria de presupuesto salvo en «Otro asunto» |
| `/privacidad`, `/aviso-legal`, `/cookies` | `*.html` | Textos legales |

Norma de Amazon KDP (guía de enlaces de Kindle): un ebook no puede enlazar a formularios que piden datos del cliente, como el email. Por eso las direcciones del libro abren páginas informativas y el material de `/libro` se puede descargar también sin dar ningún dato, contestando una pregunta del libro. El ebook dice que el material es «gratis y sin registro»: esa puerta tiene que existir siempre.

La cabecera y el pie están repetidos en cada página: si se cambian, hay que cambiarlos en todas.

Botón «Compra mi libro» (mostaza): en la cabecera de todas las páginas (también en móvil), el primero del menú del móvil, en el pie y en un bloque destacado arriba de `/libro`. Todos enlazan a `/comprar-libro`, una redirección de `vercel.json`: el enlace de Amazon se cambia en un solo sitio.

## SEO

- Cada página comercial trabaja un grupo de búsquedas: `/cumplimiento-ai-act` (consultoría AI Act), `/iso-42001` (implantación y auditoría ISO 42001), `/charlas` (charla y formación AI Act). Las guías de `/guia` cubren las preguntas y enlazan a esas tres.
- Datos estructurados (schema.org en JSON-LD) en portada, servicios, charlas y guías: Person, ProfessionalService, Service con precio, Article, BreadcrumbList y FAQPage. Si cambias un precio o una pregunta frecuente, cámbialo también en su bloque `application/ld+json`.
- `sitemap.xml` solo lleva páginas indexables. Al publicar una guía nueva: añádela al sitemap, al índice de `/guia`, a `llms.txt` y envíala en Search Console.
- Legales, `/formulario`, `/suscrito`, `/baja` y `/diagnostico` van con `noindex`. `robots.txt` no bloquea páginas (si se bloquean, Google no ve el `noindex`); solo `/api/`.
- Search Console: propiedad `https://jacobruiz.es/` en la cuenta contacto@jacobruiz.es, verificada por DNS y por la etiqueta `google-site-verification` de `index.html` (no quitarla).
- IndexNow (Bing, Yandex, Seznam, Naver): clave en `/6944e9709928970ea3dd2589c6448adb.txt`. Al publicar o cambiar una página, se avisa con `https://api.indexnow.org/indexnow?url=URL&key=6944e9709928970ea3dd2589c6448adb`.
- Palabra clave principal: «AI Act» en títulos, H1 y descripciones; «ley de IA» como variante secundaria (es como lo busca la gente: «ley ia pymes», «fechas ley ia»). «Reglamento europeo de IA» solo dentro del texto. Títulos de 60 caracteres como máximo y descripciones de 155.
- Todas las páginas llevan og:image con ancho, alto y texto alternativo, y las etiquetas twitter:title, twitter:description e twitter:image. El generador de noticias las pone solo.
- La portada enlaza a las ocho guías (seis tarjetas y dos enlaces de texto).
- Las guías dicen «Actualizado el …»: al cambiar una, actualiza la fecha visible, `dateModified` y el `lastmod` del sitemap.

## Pendiente

| Qué | Dónde |
| --- | --- |
| Enlace a Amazon | Hecho (nov 2026): `/comprar-libro` redirige a la ficha de Amazon España (eBook en preventa, ASIN B0HH2TGX5D; la tapa blanda, ASIN B0HQ477LT8, se une a la misma ficha). Para cambiarlo, editar el destino en `vercel.json` |
| Automatización del Sistema Advantys: nuevas etiquetas `motivo-ai-act` y `motivo-charla` y campo `presupuesto_confirmado` | webhook de `CONTACTO_WEBHOOK_URL` |
| Titular de los textos legales (propuesto: Advantys Ai, SL) | `privacidad.html`, `aviso-legal.html` |

Imágenes en `assets/img`: `jacob-ruiz.jpg` (782 × 978), `portada-libro.jpg` (1000 × 1500, portada definitiva con el sello rojo «Incluye curso de IA gratis», generada con el mismo sello de `maqueta/sello_portada_rojo.py`) y `og.jpg` (1200 × 630, para redes, con la portada definitiva). Si falta alguna, la web muestra un marco neutro en su lugar.

Acceso al material (`api/_acceso.js`): cookie `jr_material` firmada con `MATERIAL_SECRET` si existe en Vercel o, si no, con una clave derivada de `CONTACTO_WEBHOOK_URL`; dura un año. Si se cambian las preguntas del libro, cambiarlas en `api/_acceso.js` (con sus respuestas) y el texto en `assets/js/site.js`, en el mismo orden.

Material del libro en `libro/descargas`: los 40 archivos y el ZIP con todo, del paquete «Pagina_de_recursos_para_subir_a_la_web.zip» de la carpeta «4 Para la web» (versión del 22 de octubre, 13:50). Si se cambia algún archivo, hay que actualizar también su tamaño en `libro/index.html`.

## Noticias semanales («Actualidad del AI Act»)

- Cada noticia es un archivo `herramientas/noticias/articulos/AAAA-MM-DD-slug.md`. El manual completo (cómo elegir la noticia, comprobarla, escribirla con la voz de Jacob, SEO y publicación) está en `herramientas/noticias/GUIA.md`.
- `python3 herramientas/noticias/publicar.py --comprobar` revisa las noticias (longitudes SEO, palabra clave, enlaces internos que existan, fuente, frases prohibidas, citas largas). Si algo falla, no publica.
- `python3 herramientas/noticias/publicar.py` genera `noticias/<slug>.html` (NewsArticle, migas de pan y preguntas frecuentes en JSON-LD), `noticias/index.html`, `noticias/feed.xml` (RSS) y los bloques automáticos entre `<!-- noticias:inicio -->` y `<!-- noticias:fin -->` de `index.html`, `guia/index.html`, `sitemap.xml` y `llms.txt`. No hay que tocar esos bloques a mano.
- La cabecera y el pie de las noticias se copian de `guia/ai-act-pymes.html` cada vez que se genera: si cambian en la web, basta con volver a generar.
- Los precios de los cierres de las noticias están arriba del script (`PRECIO_PAQUETE`, `PRECIO_CHARLA`).
- Una tarea programada semanal busca la noticia, la escribe, la publica y avisa a Jacob. `herramientas/` no se publica (`.vercelignore`).

## Favicon

Monograma JR hecho con los trazos de la firma (`assets/img/firma.svg`), negro sobre el mostaza del libro. Archivos: `favicon.ico` (16, 32 y 48 px, el que pide Google), `favicon.svg`, `apple-touch-icon.png` (180 px), `assets/img/icon-96.png`, `icon-192.png`, `icon-512.png` y `site.webmanifest`. Las etiquetas están en el `<head>` de todas las páginas. Google tarda días o semanas en mostrar un favicon nuevo en los resultados.

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

`/suscrito` (`suscrito.html`, sin indexar) es la página de «Ya estás dentro» a la que lleva el botón de los emails de la campaña de reactivación del Sistema Advantys: el clic en el enlace de activación «Alta consejo diario» pone las etiquetas `newsletter-consejo-diario` y `newsletter-desde-reactivacion`.

`/baja` (`baja.html`, sin indexar) es la baja de la newsletter con confirmación. El enlace de activación «Baja email» del Sistema Advantys lleva a `https://jacobruiz.es/baja?email={{contact.email}}`. La página muestra el formulario de HighLevel «Baja newsletter consejo diario» con el email ya escrito y un botón «Confirmar la baja». La baja la hace el flujo «Newsletter · Baja por enlace» al recibir ese formulario, no el clic en el enlace: así los antivirus de empresa, que pulsan todos los enlaces de un email, ya no dan de baja a nadie.

Enlaces cortos a la newsletter con origen: `/ig` (Instagram) y `/lk` (LinkedIn) y `/tarjeta` (QR de la tarjeta de visita) llevan a `/newsletter?origen_trafico=…`, y el alta llega al CRM con ese origen. `/consejo` lleva a `/newsletter` sin origen. La vista previa de `/newsletter` al compartir el enlace es `assets/img/og-newsletter.jpg`.

## Material del libro: dos puertas

En `/libro` las descargas están bloqueadas hasta que el lector elige una de dos puertas:

1. Registro: nombre (opcional), email y aceptación de la privacidad. Va a `/api/material` (`api/material.js`), que reenvía al webhook con las etiquetas `origen-jacobruiz-es`, `lector-libro` y `material-libro`. Si el lector marca la casilla de la newsletter, se añaden `newsletter-consejo-diario` y `newsletter-desde-libro`, y entra en la automatización de la newsletter.
2. Pregunta del libro: tres preguntas que solo se contestan con el libro (están en `assets/js/site.js`, bloque «Material del libro»). No se envía ningún dato.

El desbloqueo se recuerda en el navegador del lector. Es una barrera de fricción, no de seguridad: los archivos siguen en `libro/descargas` y quien mire el código puede llegar a ellos.
