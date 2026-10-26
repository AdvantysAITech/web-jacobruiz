# jacobruiz.es

Web estática (HTML, CSS y JS sin dependencias ni paso de compilación). Se despliega en Vercel tal cual.

## Páginas

| Dirección | Archivo | Notas |
| --- | --- | --- |
| `/` | `index.html` | Portada: libro, accesos para lectores, sobre Jacob |
| `/libro` | `libro/index.html` | Material del libro. Anclas `#capitulo-1` a `#capitulo-17` y `#anexos` (las usan los QR del libro, no cambiarlas) |
| `/diagnostico` | `diagnostico.html` | Diagnóstico de procesos (QR del libro) |
| `/iso-42001` | `iso-42001.html` | Consultoría ISO/IEC 42001 y Reglamento de IA (QR del libro) |
| `/contacto` | `contacto.html` | Contacto (QR del libro) |
| `/formulario` | `formulario.html` | Formulario, un clic detrás de las páginas anteriores. Admite `?motivo=contacto`, `diagnostico`, `iso-42001` o `conferencia` |
| `/privacidad`, `/aviso-legal`, `/cookies` | `*.html` | Textos legales |

Norma de Amazon KDP: las direcciones impresas en el libro abren páginas informativas, nunca un formulario directamente.

La cabecera y el pie están repetidos en cada página: si se cambian, hay que cambiarlos en todas.

## Pendiente antes de publicar

| Qué | Dónde | Tamaño |
| --- | --- | --- |
| Foto de Jacob | `assets/img/jacob-ruiz.jpg` | 1200 × 1500 px (vertical 4:5) |
| Portada del libro | `assets/img/portada-libro.jpg` (es `Portada_Kindle.jpg` de la carpeta «2 Kindle») | 1600 × 2560 px |
| Imagen para redes | `assets/img/og.jpg` | 1200 × 630 px |
| Los 40 archivos descargables y el ZIP `Recursos_Vende_mas_y_trabaja_menos.zip` | `libro/descargas/` (contenido de la carpeta `descargas` del ZIP «Pagina_de_recursos_para_subir_a_la_web.zip») | · |
| URL del webhook del formulario | Vercel → Settings → Environment Variables → `CONTACTO_WEBHOOK_URL` | · |
| Enlace a Amazon cuando el libro esté publicado | `index.html`, comentario en la sección del libro | · |
| Titular de los textos legales (propuesto: Advantys Ai, SL) | `privacidad.html`, `aviso-legal.html` | · |

Mientras falte una imagen, la web muestra un marco neutro con el nombre del archivo que hay que subir.

## Formulario

`formulario.html` envía a `/api/contacto` (`api/contacto.js`), que valida los datos y los reenvía al webhook de `CONTACTO_WEBHOOK_URL` con las etiquetas `origen-jacobruiz-es` y `motivo-<motivo>`. En local el envío se simula y se ve en la consola.

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
