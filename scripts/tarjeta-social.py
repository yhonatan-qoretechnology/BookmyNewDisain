#!/usr/bin/env python3
"""
Genera la tarjeta social de Bookmy.

    python3 scripts/tarjeta-social.py

Deja public/web/v2/img/tarjeta-social.png, 1200x630, que es el formato
que esperan WhatsApp, LinkedIn, Facebook, Slack y X para la vista previa
de un enlace. Esa imagen la declara el <head> con og:image; si las
medidas declaradas no son las del fichero, las plataformas reservan un
hueco ancho y meten dentro una imagen recortada por el centro.

POR QUE LA MARCA NO SALE DE logo-bookmy.png
Ese PNG esta hecho para fondo claro: la "B" es verde pero "Book" y el
cursor van en azul marino, y sobre el negro del sitio no se verian. La
web tampoco lo usa: bookmy.css dibuja el logo con DOS MASCARAS (una capa
verde y otra que toma el color del texto). Aqui se hace igual, leyendo
esas dos mascaras del propio bookmy.css, asi que si algun dia cambia el
logo, esta tarjeta cambia con el y no hay dos marcas que mantener.

LAS PALABRAS SON DEL SITIO
"Reserva citas. Gestiona tu negocio." sale de las dos puertas del portal
(portal.es.ts: "Reserva o recibe citas" y "Para gestionar tu negocio").
No es un claim nuevo inventado para la ocasion.

DETERMINISTA
Las estrellas usan una semilla fija: la imagen sale byte a byte igual
cada vez. Una tarjeta que cambiara en cada ejecucion ensuciaria el
historial de git sin que nadie hubiera cambiado nada.

Necesita Pillow (pip install Pillow). No necesita red.
"""
import base64
import io
import os
import random
import re
import sys

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    sys.exit("Falta Pillow: pip install Pillow")

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(RAIZ, "public", "web", "v2", "bookmy.css")
SALIDA = os.path.join(RAIZ, "public", "web", "v2", "img", "tarjeta-social.png")

W, H = 1200, 630
BG = (3, 7, 6)            # --bg
VERDE = (111, 193, 165)   # --app-rgb
LIMA = (134, 227, 211)    # --lime-rgb
TEXTO = (234, 246, 241)   # --text

CLAIM = "Reserva citas. Gestiona tu negocio."
DOMINIO = "bookmy.es"

FUENTES = [
    "/usr/share/fonts/truetype/ubuntu/UbuntuSans[wdth,wght].ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def fuente(px, peso=700):
    for ruta in FUENTES:
        if os.path.exists(ruta):
            f = ImageFont.truetype(ruta, px)
            try:
                f.set_variation_by_axes([100, peso])   # wdth, wght
            except Exception:
                pass                                    # no es variable: da igual
            return f
    sys.exit("No hay ninguna fuente de las que busco; añade la tuya a FUENTES.")


def mascaras():
    """Las dos capas del logo, sacadas de bookmy.css.

    Devuelve la variante de la app (la primera de cada una; la segunda
    es la del CRM, con el cursor en lima).
    """
    css = io.open(CSS, encoding="utf-8").read()
    fuera = {}
    for var in ("--logo-mask-g", "--logo-mask-k"):
        m = re.search(re.escape(var) + r':\s*url\("data:image/png;base64,([^"]+)"\)', css)
        if not m:
            sys.exit(f"No encuentro {var} en bookmy.css. ¿Ha cambiado el logo?")
        fuera[var] = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("LA")
    return fuera["--logo-mask-g"], fuera["--logo-mask-k"]


def tintar(mascara, color):
    """Una mascara pintada de un color, que es lo que hace mask-image."""
    capa = Image.new("RGBA", mascara.size, color + (0,))
    capa.putalpha(mascara.getchannel("A"))
    return capa


def resplandor(lienzo, cx, cy, radio, color, fuerza):
    capa = Image.new("RGBA", lienzo.size, (0, 0, 0, 0))
    ImageDraw.Draw(capa).ellipse(
        [cx - radio, cy - radio, cx + radio, cy + radio],
        fill=color + (int(255 * fuerza),),
    )
    return Image.alpha_composite(lienzo, capa.filter(ImageFilter.GaussianBlur(radio * 0.55)))


def estrellas(img, semilla=7):
    r = random.Random(semilla)
    capa = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    for _ in range(190):
        x, y = r.randrange(W), r.randrange(H)
        radio = r.choice([0.6, 0.8, 1.0, 1.0, 1.4])
        color = VERDE if r.random() < 0.45 else TEXTO
        d.ellipse([x - radio, y - radio, x + radio, y + radio],
                  fill=color + (r.randint(16, 64),))
    return Image.alpha_composite(img, capa)


def main():
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = resplandor(img, int(W * 0.80), int(H * 0.14), 430, VERDE, 0.30)
    img = resplandor(img, int(W * 0.10), int(H * 0.95), 360, LIMA, 0.14)
    img = estrellas(img)

    g, k = mascaras()
    if g.size != k.size:
        sys.exit("Las dos máscaras del logo no miden lo mismo.")
    logo = Image.alpha_composite(tintar(k, TEXTO), tintar(g, VERDE))

    ancho = 560
    alto = round(logo.size[1] * ancho / logo.size[0])
    logo = logo.resize((ancho, alto), Image.LANCZOS)
    ly = 118
    img.alpha_composite(logo, ((W - ancho) // 2, ly))

    d = ImageDraw.Draw(img)

    f_claim = fuente(52, 600)
    cy = ly + alto + 62
    d.text(((W - d.textlength(CLAIM, font=f_claim)) / 2, cy), CLAIM,
           font=f_claim, fill=TEXTO + (255,))

    ry = cy + 96
    d.rounded_rectangle([(W - 72) / 2, ry, (W + 72) / 2, ry + 5], radius=3,
                        fill=VERDE + (255,))

    f_dom = fuente(27, 600)
    d.text(((W - d.textlength(DOMINIO, font=f_dom)) / 2, ry + 34), DOMINIO,
           font=f_dom, fill=VERDE + (235,))

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    img.convert("RGB").save(SALIDA, "PNG", optimize=True)
    w, h = Image.open(SALIDA).size
    print(f"{os.path.relpath(SALIDA, RAIZ)}  {w}x{h}  {os.path.getsize(SALIDA)//1024} KB")
    if (w, h) != (1200, 630):
        sys.exit("La imagen no mide 1200x630: revisa el script antes de declararla.")


if __name__ == "__main__":
    main()
