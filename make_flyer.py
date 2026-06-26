#!/usr/bin/env python3
"""Print-ready, double-sided party flyer (landscape, 4-up on US Letter).

Page 1: four copies of the cover picture.
Page 2: four copies of the info side — an event-ticket design.

Print double-sided (flip on short edge), cut along the center guides
into four 5.5 x 4.25" landscape flyers (picture / info).

Design: "sticker-book / backyard poster" — extends the site's
sticker-on-the-page motif. The info side is one tilted event ticket
with a perforated date stub, title + details, and a "Come on by!"
sticker ribbon overlapping the bottom edge.
"""

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image
import os

HERE = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.join(HERE, "public", "hero-illustration.jpg")
OUT = os.path.join(HERE, "foam-party-flyer.pdf")

# ── palette (globals.css) ──
SKY       = HexColor("#4cb7e8")
SKY_DEEP  = HexColor("#2c97d4")
GRASS     = HexColor("#6fbe45")
GRASS_DP  = HexColor("#4e9e2c")
TOMATO    = HexColor("#ff5440")
SUNNY     = HexColor("#ffc526")
PINK      = HexColor("#ff5ba0")
CREAM     = HexColor("#fffaef")
INK       = HexColor("#2e2016")
INK_SOFT  = HexColor("#6a5742")
WHITE     = HexColor("#ffffff")

# ── fonts ──
DISPLAY = "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("SFRounded", "/System/Library/Fonts/SFNSRounded.ttf"))
    DISPLAY = "SFRounded"
except Exception as e:
    print("SF Rounded unavailable, using Helvetica-Bold:", e)
BODY = "Helvetica"
BODY_BOLD = "Helvetica-Bold"

# ── type scale (one coherent system) ──
T_DATE  = 44   # the big "27"
T_CTA   = 22
T_TITLE = 16
T_VALUE = 12.5
T_MONTH = 13
T_TIME  = 11
T_URL   = 9.5
T_LABEL = 7.5
T_DOW   = 7.5

# ── content (src/lib/party.ts) ──
DOW   = "SATURDAY"
MONTH = "JUNE"
DAY   = "27"
TIME  = "1:00 PM"
ADDR  = "3040 Nantucket Dr"
BRING = "A towel!"
URL   = "https://thenantucket.party"

# ── geometry — landscape letter, 4-up ──
PW, PH = landscape(letter)   # 792 x 612
QW, QH = PW / 2, PH / 2      # 396 x 306

GRAD_STOPS = [
    (0.00, GRASS_DP),
    (0.20, GRASS),
    (0.46, HexColor("#b6e6c2")),
    (0.66, HexColor("#7fd0ee")),
    (1.00, SKY),
]


def vgradient(c, x, y, w, h, stops, steps=150):
    def lerp(a, b, t):
        return Color(a.red + (b.red - a.red) * t,
                     a.green + (b.green - a.green) * t,
                     a.blue + (b.blue - a.blue) * t)
    def color_at(p):
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= p <= p1:
                t = 0 if p1 == p0 else (p - p0) / (p1 - p0)
                return lerp(c0, c1, t)
        return stops[-1][1]
    bh = h / steps
    for i in range(steps):
        c.setFillColor(color_at(i / (steps - 1)))
        c.rect(x, y + i * bh, w, bh + 0.7, stroke=0, fill=1)


def clip_quarter(c, ox, oy):
    p = c.beginPath()
    p.rect(ox, oy, QW, QH)
    c.clipPath(p, stroke=0, fill=0)


def fit(c, text, font, max_w, start, floor=8):
    s = start
    while s > floor and c.stringWidth(text, font, s) > max_w:
        s -= 0.5
    return s


def sticker_rect(c, x, y, w, h, r, fill, stroke=INK, sw=3.0):
    """Rounded rect with the site's layered 'sticker' drop shadow.
    Shadow falls toward -y (down) in the current (possibly rotated) frame."""
    c.saveState()
    c.setFillColor(INK)
    c.setFillAlpha(0.10)
    c.roundRect(x - 1, y - 9, w + 2, h, r, stroke=0, fill=1)
    c.setFillAlpha(0.18)
    c.roundRect(x + 2, y - 4, w, h, r, stroke=0, fill=1)
    c.restoreState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(sw)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)


def draw_globe(c, cx, cy, r, color, lw=1.2):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.setFillAlpha(0)
    c.circle(cx, cy, r, stroke=1, fill=0)
    c.ellipse(cx - r * 0.45, cy - r, cx + r * 0.45, cy + r, stroke=1, fill=0)
    c.line(cx - r, cy, cx + r, cy)
    c.line(cx - 0.82 * r, cy + 0.5 * r, cx + 0.82 * r, cy + 0.5 * r)
    c.line(cx - 0.82 * r, cy - 0.5 * r, cx + 0.82 * r, cy - 0.5 * r)
    c.restoreState()


def foam_dots(c, ox, oy, specs):
    """Translucent white 'foam' bubbles for texture (sit on the grass strip)."""
    c.saveState()
    for dx, dy, r, a in specs:
        c.setFillColor(WHITE)
        c.setFillAlpha(a)
        c.circle(ox + dx, oy + dy, r, stroke=0, fill=1)
    c.restoreState()


# ───────────────────────── COVER (page 1) ─────────────────────────
def draw_cover(c, ox, oy, reader, iw, ih):
    c.saveState()
    clip_quarter(c, ox, oy)
    vgradient(c, ox, oy, QW, QH, GRAD_STOPS)
    img_w = QW
    img_h = img_w * ih / iw
    c.drawImage(reader, ox, oy + (QH - img_h) / 2, width=img_w, height=img_h,
                preserveAspectRatio=False, mask=None)
    c.restoreState()


# ───────────────────────── INFO (page 2) ──────────────────────────
def draw_info(c, ox, oy):
    c.saveState()
    clip_quarter(c, ox, oy)
    vgradient(c, ox, oy, QW, QH, GRAD_STOPS)
    foam_dots(c, ox, oy, [
        (58, 40, 12, 0.22), (340, 44, 16, 0.16), (120, 24, 8, 0.20),
        (300, 56, 9, 0.16), (210, 30, 11, 0.18), (24, 150, 10, 0.10),
    ])

    # ── THE TICKET (hero), tilted like a tossed sticker ──
    tw, th = 360.0, 190.0
    cxr = ox + QW / 2
    cyr = oy + 184            # nudged up; grass strip + ribbon live below
    c.saveState()
    c.translate(cxr, cyr)
    c.rotate(-1.6)
    lx, ly = -tw / 2, -th / 2          # ticket-local bottom-left
    sticker_rect(c, lx, ly, tw, th, 16, CREAM, sw=3.0)

    # stub / main split
    stub_w = 116.0
    perf_x = lx + stub_w

    # sunny header band across the stub only (date plate)
    c.saveState()
    p = c.beginPath()
    p.roundRect(lx, ly, tw, th, 16)
    c.clipPath(p, stroke=0, fill=0)
    c.setFillColor(SUNNY)
    c.rect(lx, ly, stub_w, th, stroke=0, fill=1)
    c.restoreState()

    # perforation: dashed line + punched rings top & bottom
    c.setStrokeColor(INK)
    c.setLineWidth(1.6)
    c.setDash(3, 3)
    c.line(perf_x, ly + 12, perf_x, ly + th - 12)
    c.setDash()
    for yy in (ly + th, ly):
        c.setFillColor(CREAM)
        c.setStrokeColor(INK)
        c.setLineWidth(1.6)
        c.circle(perf_x, yy, 6, stroke=1, fill=1)

    # ── stub: the date plate ──
    scx = lx + stub_w / 2
    c.setFillColor(INK)
    c.setFont(DISPLAY, T_DOW)
    c.drawCentredString(scx, 54, DOW)
    c.setFont(DISPLAY, T_MONTH)
    c.drawCentredString(scx, 34, MONTH)
    c.setFillColor(TOMATO)
    c.setFont(DISPLAY, T_DATE)
    c.drawCentredString(scx, -22, DAY)
    # small ink rule + time
    c.setStrokeColor(INK)
    c.setLineWidth(1.5)
    c.line(scx - 26, -32, scx + 26, -32)
    c.setFillColor(INK)
    c.setFont(BODY_BOLD, T_TIME)
    c.drawCentredString(scx, -48, TIME)

    # ── main panel ──
    mx = perf_x + 16
    right = lx + tw - 14
    maxw = right - mx

    # title (two tight lines)
    c.setFont(DISPLAY, T_TITLE)
    c.setFillColor(INK)
    c.drawString(mx, 56, "Foam Party")
    c.setFillColor(TOMATO)
    c.drawString(mx, 56 - T_TITLE * 1.02, "& Pig Roast")
    # sunny underline accent
    c.setStrokeColor(SUNNY)
    c.setLineWidth(3.5)
    c.setLineCap(1)
    c.line(mx + 1, 30, mx + 64, 30)

    def field(y, label, value):
        c.setFont(DISPLAY, T_LABEL)
        c.setFillColor(INK_SOFT)
        c.drawString(mx, y, label)
        c.setFont(BODY_BOLD, T_VALUE)
        c.setFillColor(INK)
        c.drawString(mx, y - 14, value)

    field(14, "WHERE", ADDR)
    field(-26, "BRING", BRING)

    # url — the ticket "barcode" line
    gx = mx + 5
    c.setFont(BODY_BOLD, T_URL)
    uw = c.stringWidth(URL, BODY_BOLD, T_URL)
    draw_globe(c, gx, -62, 4.5, SKY_DEEP, lw=1.1)
    tx = gx + 10
    c.setFillColor(SKY_DEEP)
    c.drawString(tx, -65, URL)
    c.setStrokeColor(SKY_DEEP)
    c.setLineWidth(0.9)
    c.line(tx, -67.5, tx + uw, -67.5)

    c.restoreState()  # end ticket frame

    # ── "Come on by!" — sticker ribbon overlapping ticket bottom ──
    c.saveState()
    c.translate(cxr, oy + 70)
    c.rotate(3.0)
    cw, ch = 188.0, 46.0
    sticker_rect(c, -cw / 2, -ch / 2, cw, ch, ch / 2, TOMATO, sw=2.6)
    cta_s = fit(c, "Come on by!", DISPLAY, cw - 26, T_CTA, floor=15)
    c.setFillColor(CREAM)
    c.setFont(DISPLAY, cta_s)
    c.drawCentredString(0, -cta_s * 0.34, "Come on by!")
    c.restoreState()

    c.restoreState()  # end quarter


def cut_guides(c):
    c.setStrokeColor(HexColor("#9a9a9a"))
    c.setLineWidth(0.5)
    c.setDash(4, 4)
    c.line(QW, 0, QW, PH)
    c.line(0, QH, PW, QH)
    c.setDash()


def main():
    pil = Image.open(HERO).convert("RGB")
    iw, ih = pil.size
    reader = ImageReader(pil)
    quarters = [(0, QH), (QW, QH), (0, 0), (QW, 0)]

    c = canvas.Canvas(OUT, pagesize=landscape(letter))
    c.setTitle("Foam Party & Pig Roast — Flyer")

    for ox, oy in quarters:
        draw_cover(c, ox, oy, reader, iw, ih)
    cut_guides(c)
    c.showPage()

    for ox, oy in quarters:
        draw_info(c, ox, oy)
    cut_guides(c)
    c.showPage()

    c.save()
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
