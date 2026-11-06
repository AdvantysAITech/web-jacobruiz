#!/usr/bin/env python3
"""
Generador de la sección «Actualidad del AI Act» de jacobruiz.es (/noticias).

Cada noticia es un archivo de texto en herramientas/noticias/articulos/AAAA-MM-DD-slug.md
con una cabecera de datos y el cuerpo en un formato sencillo (ver GUIA.md). Este script:

  1. Comprueba cada noticia (longitudes SEO, enlaces internos, fuente, frases prohibidas…).
     Si algo no cumple, se para y dice qué, sin tocar la web.
  2. Genera noticias/<slug>.html con el diseño de la web, datos estructurados NewsArticle,
     migas de pan y preguntas frecuentes.
  3. Rehace noticias/index.html, noticias/feed.xml (RSS), el bloque de últimas noticias de la
     portada y de la guía, y las entradas de noticias en sitemap.xml y llms.txt.

Uso:  python3 herramientas/noticias/publicar.py            (genera todo)
      python3 herramientas/noticias/publicar.py --comprobar (solo comprueba, no escribe)
Sin dependencias: solo Python 3.
"""
import datetime as dt
import html
import json
import os
import re
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ARTICULOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "articulos")
SALIDA = os.path.join(RAIZ, "noticias")
PLANTILLA = os.path.join(RAIZ, "guia", "ai-act-pymes.html")  # de aquí salen cabecera y pie
WEB = "https://jacobruiz.es"

# Precios de los cierres. Si cambian, se cambian aquí (y en el resto de la web).
PRECIO_PAQUETE = "3.900 € + IVA"
PRECIO_CHARLA = "900 € + IVA"

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]

# Expresiones que delatan un texto escrito por IA o que Jacob no usa. Si aparecen, no se publica.
PROHIBIDAS = [
    "en conclusión", "en resumen,", "cabe destacar", "cabe señalar", "sin lugar a dudas",
    "en el panorama actual", "en el mundo actual", "en la era de", "navegar por", "adentrémonos",
    "sumérgete", "no solo eso", "en definitiva,", "es importante destacar", "es crucial",
    "juega un papel", "desempeña un papel", "un antes y un después", "revolucionar",
    "estar en regla", "en un mundo cada vez más", "panorama regulatorio", "¡", "—", "1.990",
]
CAMPOS = ["titulo", "titulo_seo", "descripcion", "entradilla", "fecha", "palabra_clave",
          "fuente_nombre", "fuente_url"]


def fecha_larga(d):
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def esc(s):
    return html.escape(s, quote=True)


# ---------------------------------------------------------------- lectura de artículos
def leer(ruta):
    texto = open(ruta, encoding="utf-8").read().replace("\r\n", "\n")
    m = re.match(r"---\n(.*?)\n---\n(.*)$", texto, re.S)
    if not m:
        raise ValueError("falta la cabecera entre líneas ---")
    datos, cuerpo = {}, m.group(2).strip()
    clave = None
    for linea in m.group(1).split("\n"):
        if not linea.strip():
            continue
        lm = re.match(r"^([a-z_]+):\s*(.*)$", linea)
        if lm:
            clave, valor = lm.group(1), lm.group(2).strip()
            datos[clave] = valor if valor else []
        elif linea.lstrip().startswith("- ") and clave:
            if not isinstance(datos.get(clave), list):
                datos[clave] = []
            datos[clave].append(linea.lstrip()[2:].strip())
        else:
            raise ValueError(f"línea de cabecera no válida: {linea!r}")
    base = os.path.basename(ruta)
    fm = re.match(r"^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$", base)
    if not fm:
        raise ValueError("el nombre del archivo debe ser AAAA-MM-DD-slug.md (minúsculas, números y guiones)")
    datos["slug"] = fm.group(2)
    datos["_archivo"] = base
    datos["cuerpo"] = cuerpo
    return datos


def inline(s):
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)

    def enlace(m):
        texto, url = m.group(1), html.unescape(m.group(2))
        externo = url.startswith("http") and not url.startswith(WEB)
        rel = ' rel="noopener"' if externo else ""
        return f'<a href="{esc(url)}"{rel}>{texto}</a>'
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", enlace, s)
    return s


def cuerpo_html(md):
    """Formato admitido: ## y ### títulos, párrafos, listas con - o 1., > cita, **negrita**, [texto](url)."""
    bloques, faq, h2s = [], [], []
    lineas = md.split("\n")
    i, en_faq, pregunta = 0, False, None
    while i < len(lineas):
        l = lineas[i].rstrip()
        if not l.strip():
            i += 1
            continue
        if l.startswith("## "):
            t = l[3:].strip()
            en_faq = t.lower() == "preguntas frecuentes"
            h2s.append(t)
            bloques.append(("h2", f"<h2>{inline(t)}</h2>"))
            i += 1
            continue
        if l.startswith("### "):
            t = l[4:].strip()
            if en_faq:
                pregunta = t
            bloques.append(("h3", f"<h3>{inline(t)}</h3>"))
            i += 1
            continue
        if re.match(r"^(- |\d+\. )", l):
            ordenada = bool(re.match(r"^\d+\. ", l))
            items = []
            while i < len(lineas) and re.match(r"^(- |\d+\. )", lineas[i]):
                items.append(re.sub(r"^(- |\d+\. )", "", lineas[i]).strip())
                i += 1
            tag = "ol" if ordenada else "ul"
            bloques.append(("lista", f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"))
            continue
        if l.startswith("> "):
            partes = []
            while i < len(lineas) and lineas[i].startswith("> "):
                partes.append(lineas[i][2:].strip())
                i += 1
            bloques.append(("cita", "<blockquote><p>" + inline(" ".join(partes)) + "</p></blockquote>"))
            continue
        partes = []
        while i < len(lineas) and lineas[i].strip() and not re.match(r"^(#{2,3} |- |\d+\. |> )", lineas[i]):
            partes.append(lineas[i].strip())
            i += 1
        p = " ".join(partes)
        bloques.append(("p", f"<p>{inline(p)}</p>"))
        if en_faq and pregunta:
            faq.append((pregunta, re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", p).replace("**", "")))
            pregunta = None
    return bloques, faq, h2s


# ---------------------------------------------------------------- comprobaciones
def comprobar(a, todos):
    e = []
    for c in CAMPOS:
        if not a.get(c) or isinstance(a.get(c), list):
            e.append(f"falta el campo «{c}»")
    if e:
        return e
    try:
        f = dt.date.fromisoformat(a["fecha"])
    except ValueError:
        return ["«fecha» debe ser AAAA-MM-DD"]
    if not a["_archivo"].startswith(a["fecha"]):
        e.append("la fecha del nombre del archivo no coincide con «fecha»")
    if f > dt.date.today() + dt.timedelta(days=1):
        e.append("la fecha está en el futuro")
    if len(a["titulo_seo"]) > 60:
        e.append(f"«titulo_seo» tiene {len(a['titulo_seo'])} caracteres (máximo 60)")
    if not 120 <= len(a["descripcion"]) <= 158:
        e.append(f"«descripcion» tiene {len(a['descripcion'])} caracteres (entre 120 y 158)")
    if len(a["titulo"]) > 110:
        e.append("«titulo» es demasiado largo (máximo 110)")
    kw = a["palabra_clave"].lower()
    if kw not in a["titulo_seo"].lower():
        e.append("la palabra clave no está en «titulo_seo»")
    if kw not in a["descripcion"].lower():
        e.append("la palabra clave no está en «descripcion»")
    primer_parrafo = next((x for x in a["cuerpo"].split("\n\n") if x.strip() and not x.startswith("#")), "")
    if kw not in (a["entradilla"] + " " + primer_parrafo).lower():
        e.append("la palabra clave no aparece en la entradilla ni en el primer párrafo")
    if len(a["slug"].split("-")) > 8:
        e.append("el slug tiene más de 8 palabras")
    if not a["fuente_url"].startswith("https://"):
        e.append("«fuente_url» debe empezar por https://")
    palabras = len(re.findall(r"\w+", a["cuerpo"]))
    if not 650 <= palabras <= 1400:
        e.append(f"el cuerpo tiene {palabras} palabras (entre 650 y 1.400)")
    internos = set(re.findall(r"\]\((/[^)\s]*)\)", a["cuerpo"]))
    guias = [x for x in internos if x.startswith("/guia/")]
    if len(guias) < 2:
        e.append("hacen falta al menos 2 enlaces a guías (/guia/...)")
    rutas_validas = set()
    for base, _, archivos in os.walk(RAIZ):
        if "/.git" in base or "/herramientas" in base:
            continue
        for n in archivos:
            if n.endswith(".html"):
                rel = os.path.relpath(os.path.join(base, n), RAIZ)[:-5]
                rel = "/" + rel.replace("index", "").rstrip("/")
                rutas_validas.add(rel or "/")
    for x in todos:
        rutas_validas.add("/noticias/" + x["slug"])
    rutas_validas.update(["/comprar-libro", "/noticias", "/"])
    for x in internos:
        limpio = x.split("#")[0].rstrip("/") or "/"
        if limpio not in rutas_validas:
            e.append(f"enlace interno roto: {x}")
    if a["fuente_url"] not in a["cuerpo"]:
        e.append("el cuerpo tiene que enlazar la fuente («fuente_url») al menos una vez")
    secciones = re.findall(r"^## (.+)$", a["cuerpo"], re.M)
    if len(secciones) < 3:
        e.append("hacen falta al menos 3 apartados ##")
    if "Preguntas frecuentes" not in secciones:
        e.append("falta el apartado «## Preguntas frecuentes»")
    else:
        n = len(re.findall(r"^### ", a["cuerpo"].split("## Preguntas frecuentes", 1)[1], re.M))
        if not 2 <= n <= 4:
            e.append("«Preguntas frecuentes» debe tener entre 2 y 4 preguntas ###")
    texto_total = " ".join([a["titulo"], a["titulo_seo"], a["descripcion"], a["entradilla"], a["cuerpo"]]).lower()
    for p in PROHIBIDAS:
        if p.lower() in texto_total:
            e.append(f"expresión prohibida: «{p}»")
    for cita in re.findall(r"^> (.+)$", a["cuerpo"], re.M):
        if len(cita.split()) > 25:
            e.append("una cita textual pasa de 25 palabras: resúmela con tus palabras")
    if re.search(r"(?<!\*)\*(?!\*)", a["cuerpo"]):
        e.append("hay un asterisco suelto (solo se admite **negrita**)")
    if re.search(r"\b[A-ZÁÉÍÓÚÑ]{6,}\b", a["cuerpo"].replace("ISO/IEC", "")):
        sospechosas = [w for w in re.findall(r"\b[A-ZÁÉÍÓÚÑ]{6,}\b", a["cuerpo"]) if w not in ("AESIA", "CENELEC")]
        if sospechosas:
            e.append(f"palabras en mayúsculas forzadas: {', '.join(sorted(set(sospechosas)))}")
    for otro in todos:
        if otro is a:
            continue
        if otro["slug"] == a["slug"]:
            e.append(f"slug repetido con {otro['_archivo']}")
        if otro["fuente_url"] == a["fuente_url"]:
            e.append(f"la fuente ya se usó en {otro['_archivo']}")
    return e


# ---------------------------------------------------------------- piezas comunes
def piezas():
    t = open(PLANTILLA, encoding="utf-8").read()
    cab = t[t.index("<body>"):t.index('<main id="contenido">')]
    cab = cab.replace(' aria-current="page"', "")
    pie = t[t.index("</main>"):]
    iconos = t[t.index('<link rel="icon" href="/favicon.ico"'):t.index("<script>document.documentElement")]
    iconos += '<script>document.documentElement.classList.add("js")</script>\n'
    persona = None
    for bloque in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        for nodo in json.loads(bloque).get("@graph", []):
            if nodo.get("@type") == "Person":
                persona = nodo
    return cab, pie, iconos, persona


def cabeza(titulo, descripcion, url, tipo, ld, extra=""):
    _, _, iconos, _ = PIEZAS
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(descripcion)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta name="author" content="Jacob Ruiz">
<meta name="theme-color" content="#0c0d0f">
<meta property="og:type" content="{tipo}">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Jacob Ruiz">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(descripcion)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{WEB}/assets/img/og.jpg?v=3">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Jacob Ruiz, consultor del AI Act, y su libro «Vende más y trabaja menos»">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(titulo)}">
<meta name="twitter:description" content="{esc(descripcion)}">
<meta name="twitter:image" content="{WEB}/assets/img/og.jpg?v=3">
<meta name="twitter:image:alt" content="Jacob Ruiz, consultor del AI Act, y su libro «Vende más y trabaja menos»">
<link rel="alternate" type="application/rss+xml" title="Actualidad del AI Act · Jacob Ruiz" href="{WEB}/noticias/feed.xml">
{extra}{iconos}<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
"""


ICONO_FLECHA = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-arrow-right"/></svg>'


def boton(texto, href):
    return f'<a class="btn" href="{href}"><span>{texto}</span><span class="btn__dot">{ICONO_FLECHA}</span></a>'


def tarjeta(a, h="h3"):
    f = dt.date.fromisoformat(a["fecha"])
    return (f'<li><a class="guide" href="/noticias/{a["slug"]}"><p class="news-date"><time datetime="{a["fecha"]}">{fecha_larga(f)}</time></p>'
            f'<{h}>{esc(a["titulo"])}</{h}><p>{esc(a["entradilla"])}</p>'
            f'<span class="link-arrow">Leer la noticia {ICONO_FLECHA}</span></a></li>')


# ---------------------------------------------------------------- páginas
def pagina_articulo(a, todos):
    cab, pie, _, persona = PIEZAS
    url = f"{WEB}/noticias/{a['slug']}"
    f = dt.date.fromisoformat(a["fecha"])
    act = a.get("actualizado") if isinstance(a.get("actualizado"), str) and a.get("actualizado") else a["fecha"]
    bloques, faq, _ = cuerpo_html(a["cuerpo"])
    palabras = len(re.findall(r"\w+", a["cuerpo"]))
    minutos = max(2, round(palabras / 220))
    fuentes = [(a["fuente_nombre"], a["fuente_url"])]
    for x in a.get("otras_fuentes") or []:
        m = re.match(r"^(.+?)\s*\|\s*(https://\S+)$", x)
        if m:
            fuentes.append((m.group(1), m.group(2)))

    # Bloque de venta tras el segundo apartado
    partes, h2_vistos, callout_puesto = [], 0, False
    callout = (f'<div class="callout">\n  <p><strong>¿Prefieres que te lo deje hecho?</strong> Inventario, riesgos, política de uso, avisos, '
               f'formación registrada y carpeta de evidencias. {PRECIO_PAQUETE}, precio cerrado.</p>\n  {boton("Ver el paquete", "/cumplimiento-ai-act")}\n</div>')
    for tipo, h in bloques:
        if tipo == "h2":
            h2_vistos += 1
            if h2_vistos == 3 and not callout_puesto:
                partes.append(callout)
                callout_puesto = True
        partes.append(h)
    if not callout_puesto:
        partes.append(callout)

    lista_fuentes = "".join(f'<li><a href="{esc(u)}" rel="noopener">{esc(n)}</a></li>' for n, u in fuentes)
    relacionadas = [x for x in todos if x is not a][:3]
    otras = ""
    if relacionadas:
        otras = ('<section class="section" style="padding-top:0">\n  <div class="wrap">\n    <h2 class="h2">Más actualidad del AI Act</h2>\n'
                 '    <ul class="guides">\n' + "\n".join(tarjeta(x) for x in relacionadas) + '\n    </ul>\n'
                 f'    <p style="margin-top:28px"><a class="link-arrow" href="/noticias">Todas las noticias {ICONO_FLECHA}</a></p>\n  </div>\n</section>\n')

    ld_graph = [persona, {"@type": "WebSite", "@id": f"{WEB}/#web", "url": f"{WEB}/", "name": "Jacob Ruiz", "inLanguage": "es-ES", "publisher": {"@id": f"{WEB}/#jacob"}},
                {"@type": "NewsArticle", "@id": url + "#articulo", "headline": a["titulo"][:110], "description": a["descripcion"],
                 "inLanguage": "es-ES", "datePublished": a["fecha"] + "T08:00:00+01:00", "dateModified": act + "T08:00:00+01:00",
                 "author": {"@id": f"{WEB}/#jacob"}, "publisher": {"@id": f"{WEB}/#jacob"}, "mainEntityOfPage": url,
                 "image": [f"{WEB}/assets/img/og.jpg"], "wordCount": palabras, "keywords": a["palabra_clave"],
                 "articleSection": "Actualidad del AI Act", "isBasedOn": a["fuente_url"],
                 "citation": [u for _, u in fuentes],
                 "about": {"@type": "Legislation", "name": "Reglamento (UE) 2024/1689 de inteligencia artificial", "legislationIdentifier": "CELEX:32024R1689"}},
                {"@type": "BreadcrumbList", "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{WEB}/"},
                    {"@type": "ListItem", "position": 2, "name": "Actualidad del AI Act", "item": f"{WEB}/noticias"},
                    {"@type": "ListItem", "position": 3, "name": a["titulo"][:80], "item": url}]}]
    if faq:
        ld_graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]})
    ld = {"@context": "https://schema.org", "@graph": [n for n in ld_graph if n]}
    extra = (f'<meta property="article:published_time" content="{a["fecha"]}T08:00:00+01:00">\n'
             f'<meta property="article:modified_time" content="{act}T08:00:00+01:00">\n'
             '<meta property="article:section" content="Actualidad del AI Act">\n')

    cuerpo = "\n".join(partes)
    return cabeza(f'{a["titulo_seo"]} · Jacob Ruiz' if len(a["titulo_seo"]) <= 46 else a["titulo_seo"], a["descripcion"], url, "article", ld, extra) + cab + f"""<main id="contenido">
<article>
<section class="page-head article-head" style="padding-bottom:32px">
  <div class="wrap">
    <ol class="crumbs" aria-label="Estás aquí"><li><a href="/">Inicio</a></li><li><a href="/noticias">Actualidad del AI Act</a></li><li aria-current="page">{esc(a['titulo'][:60] + ('…' if len(a['titulo']) > 60 else ''))}</li></ol>
    <h1 class="display">{esc(a['titulo'])}</h1>
    <p class="lead">{esc(a['entradilla'])}</p>
    <p class="meta article-meta">Por <a href="/#sobre-mi">Jacob Ruiz</a> · <time datetime="{a['fecha']}">{fecha_larga(f)}</time> · {minutos} min de lectura</p>
  </div>
</section>
<section class="section--tight" style="padding-top:0">
  <div class="wrap"><div class="prose article-body">
{cuerpo}
<div class="news-sources">
  <h2>Fuentes</h2>
  <ul>{lista_fuentes}</ul>
</div>
<p class="article-disclaimer">Noticia comentada con fines divulgativos, no asesoramiento jurídico. No soy abogado: si tu caso lo necesita, consúltalo con uno. Datos comprobados a fecha de publicación.</p>
  </div></div>
</section>
</article>
{otras}<section class="section--tight" style="padding-top:0">
  <div class="wrap">
    <div class="closing" data-reveal>
      <div>
        <h2 class="h2">Cada semana, lo que cambia en el AI Act. Explicado para tu empresa.</h2>
        <p>Y si prefieres no estar pendiente: te dejo el cumplimiento hecho por {PRECIO_PAQUETE}, precio cerrado.</p>
      </div>
      {boton("Ver el paquete", "/cumplimiento-ai-act")}
    </div>
  </div>
</section>
""" + pie


def pagina_indice(todos):
    cab, pie, _, persona = PIEZAS
    url = f"{WEB}/noticias"
    desc = ("Las noticias del AI Act que afectan a tu empresa, explicadas cada semana sin jerga por Jacob Ruiz: "
            "qué ha pasado con la ley de IA y qué hacer.")
    ld = {"@context": "https://schema.org", "@graph": [persona,
          {"@type": "CollectionPage", "@id": url + "#pagina", "url": url, "name": "Actualidad del AI Act", "description": desc,
           "inLanguage": "es-ES", "author": {"@id": f"{WEB}/#jacob"},
           "mainEntity": {"@type": "ItemList", "itemListElement": [
               {"@type": "ListItem", "position": i + 1, "url": f"{WEB}/noticias/{a['slug']}", "name": a["titulo"]} for i, a in enumerate(todos)]}},
          {"@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{WEB}/"},
              {"@type": "ListItem", "position": 2, "name": "Actualidad del AI Act", "item": url}]}]}
    lista = "\n".join(tarjeta(a, "h2") for a in todos) or '<li><p>Muy pronto, la primera noticia.</p></li>'
    return cabeza("Noticias del AI Act: actualidad de la ley de IA · Jacob Ruiz", desc, url, "website", ld) + cab + f"""<main id="contenido">
<section class="page-head">
  <div class="wrap">
    <ol class="crumbs" aria-label="Estás aquí"><li><a href="/">Inicio</a></li><li aria-current="page">Actualidad del AI Act</li></ol>
    <p class="eyebrow">Una noticia cada semana</p>
    <h1 class="display">Actualidad del AI Act</h1>
    <p class="lead">Lo que se mueve en Europa con el Reglamento europeo de inteligencia artificial, contado para quien tiene una empresa y poco tiempo. Qué ha pasado, qué significa para ti y qué haría yo.</p>
    <div class="actions"><a class="link-arrow" href="/noticias/feed.xml">Suscríbete por RSS <svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-arrow-up-right"/></svg></a> <a class="link-arrow" href="/guia">Guía del AI Act {ICONO_FLECHA}</a></div>
  </div>
</section>
<section class="section--tight" style="padding-top:0">
  <div class="wrap">
    <ul class="guides news-list">
{lista}
    </ul>
  </div>
</section>
<section class="section--tight">
  <div class="wrap">
    <div class="closing" data-reveal>
      <div>
        <h2 class="h2">¿Prefieres que te lo deje hecho?</h2>
        <p>Inventario, riesgos, política de uso, avisos, formación registrada y carpeta de evidencias. {PRECIO_PAQUETE}, precio cerrado. O una charla para tu equipo por {PRECIO_CHARLA}.</p>
      </div>
      {boton("Ver el paquete", "/cumplimiento-ai-act")}
    </div>
  </div>
</section>
""" + pie


def rss(todos):
    items = []
    for a in todos[:20]:
        f = dt.datetime.fromisoformat(a["fecha"] + "T08:00:00+01:00")
        items.append(f"""  <item>
    <title>{esc(a['titulo'])}</title>
    <link>{WEB}/noticias/{a['slug']}</link>
    <guid isPermaLink="true">{WEB}/noticias/{a['slug']}</guid>
    <pubDate>{f.strftime('%a, %d %b %Y %H:%M:%S %z')}</pubDate>
    <description>{esc(a['descripcion'])}</description>
  </item>""")
    ahora = dt.datetime.now(dt.timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Actualidad del AI Act · Jacob Ruiz</title>
  <link>{WEB}/noticias</link>
  <atom:link href="{WEB}/noticias/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Las noticias del Reglamento europeo de inteligencia artificial explicadas para empresas, cada semana.</description>
  <language>es-es</language>
  <lastBuildDate>{ahora}</lastBuildDate>
{chr(10).join(items)}
</channel>
</rss>
"""


def reemplazar_bloque(ruta, marca, contenido):
    t = open(ruta, encoding="utf-8").read()
    ini, fin = f"<!-- {marca}:inicio -->", f"<!-- {marca}:fin -->"
    if ini not in t or fin not in t:
        raise SystemExit(f"Faltan las marcas {ini} / {fin} en {ruta}")
    nuevo = t[:t.index(ini) + len(ini)] + "\n" + contenido + "\n" + t[t.index(fin):]
    if nuevo != t:
        open(ruta, "w", encoding="utf-8").write(nuevo)


def bloque_portada(todos):
    if not todos:
        return ""
    return f"""<section class="section" style="padding-top:0">
  <div class="wrap">
    <h2 class="statement" data-reveal>Lo último del AI Act. <em>Cada semana.</em></h2>
    <p class="kicker" data-reveal style="--i:1">Las noticias del Reglamento europeo de IA que afectan a tu empresa, explicadas sin jerga.</p>
    <ul class="guides">
{chr(10).join(tarjeta(a) for a in todos[:3])}
    </ul>
    <p data-reveal style="margin-top:28px"><a class="link-arrow" href="/noticias">Toda la actualidad del AI Act {ICONO_FLECHA}</a></p>
  </div>
</section>"""


def bloque_guia(todos):
    if not todos:
        return ""
    return f"""    <h2 class="h2" style="margin-top:72px">Actualidad del AI Act</h2>
    <ul class="guides">
{chr(10).join(tarjeta(a) for a in todos[:3])}
</ul>
    <p style="margin-top:28px"><a class="link-arrow" href="/noticias">Todas las noticias {ICONO_FLECHA}</a></p>"""


def bloque_sitemap(todos):
    hoy = max([a.get("actualizado") if isinstance(a.get("actualizado"), str) and a.get("actualizado") else a["fecha"] for a in todos] or [dt.date.today().isoformat()])
    filas = [f"  <url><loc>{WEB}/noticias</loc><lastmod>{hoy}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>"]
    for a in todos:
        act = a.get("actualizado") if isinstance(a.get("actualizado"), str) and a.get("actualizado") else a["fecha"]
        filas.append(f"  <url><loc>{WEB}/noticias/{a['slug']}</loc><lastmod>{act}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>")
    return "\n".join(filas)


def bloque_llms(todos):
    filas = ["## Actualidad del AI Act", f"- [Todas las noticias]({WEB}/noticias): una noticia comentada cada semana sobre el Reglamento europeo de IA."]
    for a in todos[:10]:
        filas.append(f"- [{a['titulo']}]({WEB}/noticias/{a['slug']}) ({a['fecha']})")
    return "\n".join(filas)


# ---------------------------------------------------------------- principal
def main():
    solo_comprobar = "--comprobar" in sys.argv
    os.makedirs(ARTICULOS, exist_ok=True)
    rutas = sorted(os.path.join(ARTICULOS, n) for n in os.listdir(ARTICULOS) if n.endswith(".md"))
    todos, errores = [], {}
    for r in rutas:
        try:
            todos.append(leer(r))
        except ValueError as ex:
            errores[os.path.basename(r)] = [str(ex)]
    for a in todos:
        e = comprobar(a, todos)
        if e:
            errores[a["_archivo"]] = e
    if errores:
        print("NO SE PUBLICA. Corrige esto:")
        for k, v in errores.items():
            for x in v:
                print(f"  {k}: {x}")
        sys.exit(1)
    todos.sort(key=lambda a: (a["fecha"], a["_archivo"]), reverse=True)
    print(f"OK: {len(todos)} noticias comprobadas.")
    if solo_comprobar:
        return
    global PIEZAS
    PIEZAS = piezas()
    os.makedirs(SALIDA, exist_ok=True)
    vivos = set()
    for a in todos:
        destino = os.path.join(SALIDA, a["slug"] + ".html")
        open(destino, "w", encoding="utf-8").write(pagina_articulo(a, todos))
        vivos.add(a["slug"] + ".html")
    for n in os.listdir(SALIDA):  # páginas de noticias que ya no existen
        if n.endswith(".html") and n != "index.html" and n not in vivos:
            os.remove(os.path.join(SALIDA, n))
    open(os.path.join(SALIDA, "index.html"), "w", encoding="utf-8").write(pagina_indice(todos))
    open(os.path.join(SALIDA, "feed.xml"), "w", encoding="utf-8").write(rss(todos))
    reemplazar_bloque(os.path.join(RAIZ, "index.html"), "noticias", bloque_portada(todos))
    reemplazar_bloque(os.path.join(RAIZ, "guia", "index.html"), "noticias", bloque_guia(todos))
    reemplazar_bloque(os.path.join(RAIZ, "sitemap.xml"), "noticias", bloque_sitemap(todos))
    reemplazar_bloque(os.path.join(RAIZ, "llms.txt"), "noticias", bloque_llms(todos))
    for a in todos:
        print(f"  {WEB}/noticias/{a['slug']}")


PIEZAS = None
if __name__ == "__main__":
    main()
