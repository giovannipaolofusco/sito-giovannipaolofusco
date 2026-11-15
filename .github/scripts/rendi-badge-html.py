#!/usr/bin/env python3
"""Scrive le card dei badge dentro certificazioni.html, invece di lasciarle
costruire al browser dopo un fetch.

Perche' esiste. Fino al 15/08/2026 i badge venivano iniettati da script.js dopo
aver scaricato badges.json: il contenitore partiva vuoto e si riempiva a pagina
gia' leggibile, spingendo giu' l'elenco dei certificati sottostante. Era 0,340 di
Cumulative Layout Shift, oltre tre volte la soglia. Il rimedio applicato allora fu
un min-height in CSS che riserva lo spazio — funziona, ma compensa il sintomo.

Qui il problema sparisce alla radice: i dati sono gia' noti quando il workflow
notturno gira, quindi non c'e' ragione di farli scaricare al browser. Con le card
nell'HTML si ottengono quattro cose insieme:
  - nessuno spostamento di layout, per costruzione e non per compensazione;
  - i badge diventano indicizzabili dai motori di ricerca, che oggi non li vedono;
  - la pagina funziona senza JavaScript;
  - sparisce una richiesta di rete a ogni visita.

Il markup prodotto e' identico a quello che il ripiego di script.js costruisce con le API del DOM.

Idempotente: riscrive solo cio' che sta fra i marcatori, quindi puo' girare a ogni
esecuzione del workflow senza accumulare nulla.
"""

import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
BADGE = RADICE / "badges.json"
BADGE_EXTRA = RADICE / "badges-extra.json"

# La griglia esiste in entrambe le lingue con lo stesso id: cambiano solo il
# formato della data, la parola «Verifica» e il file.
PAGINE = [
    (RADICE / "certificazioni.html", "it"),
    (RADICE / "en" / "certificazioni.html", "en"),
]

INIZIO = "<!-- BADGE:INIZIO -->"
FINE = "<!-- BADGE:FINE -->"

MESI_IT = [
    "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
]
MESI_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def carica(percorso):
    """Legge un file di badge, tollerando sia la lista nuda sia {"data": [...]}."""
    if not percorso.exists():
        return []
    try:
        documento = json.loads(percorso.read_text(encoding="utf-8"))
    except json.JSONDecodeError as errore:
        sys.exit(f"{percorso.name} non e' un JSON valido: {errore}")
    if isinstance(documento, list):
        return documento
    dati = documento.get("data")
    return dati if isinstance(dati, list) else []


def campo_data(badge):
    return badge.get("issued_at_date") or badge.get("issued_at") or ""


def ordina(badge):
    """Cronologico decrescente, come faceva script.js. Le voci senza data
    finiscono in fondo invece di far esplodere il confronto."""
    def chiave(voce):
        grezza = campo_data(voce)
        try:
            return datetime.fromisoformat(str(grezza)[:10])
        except (ValueError, TypeError):
            return datetime.min
    return sorted(badge, key=chiave, reverse=True)


def data_leggibile(grezza, lingua):
    try:
        d = datetime.fromisoformat(str(grezza)[:10])
    except (ValueError, TypeError):
        return html.escape(str(grezza)) if grezza else ""
    if lingua == "en":
        return f"{MESI_EN[d.month - 1]} {d.day}, {d.year}"
    return f"{d.day} {MESI_IT[d.month - 1]} {d.year}"


def titolo(badge):
    modello = badge.get("badge_template") or {}
    return modello.get("name") or badge.get("name") or "Certificazione"


def immagine(badge):
    modello = badge.get("badge_template") or {}
    png = (
        (modello.get("image") or {}).get("url")
        or modello.get("image_url")
        or badge.get("image_url")
        or ""
    )
    webp = modello.get("image_webp") or badge.get("image_webp") or ""
    return png, webp


def collegamento(badge):
    """Solo http/https, come il controllo che script.js faceva sull'href: un
    valore arbitrario dal JSON potrebbe essere un 'javascript:'."""
    diretto = badge.get("badge_url")
    if not diretto and badge.get("id"):
        diretto = f"https://www.credly.com/badges/{badge['id']}"
    if diretto and re.match(r"^https?://", str(diretto)):
        return str(diretto)
    return "#"


VERIFICA = {"it": "Verifica", "en": "Verify"}


def ente(badge):
    """Ente per i filtri della pagina: lo stesso criterio del generatore delle pagine."""
    if "claude.com" in collegamento(badge):
        return "anthropic"
    return "google" if titolo(badge).startswith("Google") else "altri"


def card(badge, lingua):
    """Una card della griglia filtrabile (restyling del 15/11/2026). L'immagine ha
    alt vuoto perche' il titolo e' scritto accanto, dentro lo stesso link: con il
    nome anche nell'alt lo screen reader lo leggerebbe due volte."""
    nome_sicuro = html.escape(titolo(badge), quote=True)
    png, webp = immagine(badge)
    quando = data_leggibile(campo_data(badge), lingua)
    parti = [
        f'<li class="ct-badge pg__carta" data-cat="{ente(badge)}">'
        f'<a href="{html.escape(collegamento(badge), quote=True)}" target="_blank" rel="noopener noreferrer">'
    ]
    if png:
        img = (f'<img src="{html.escape(png, quote=True)}" alt="" width="110" height="110"'
               f' loading="lazy" decoding="async" />')
        parti.append(f'<picture><source srcset="{html.escape(webp, quote=True)}" type="image/webp" />{img}</picture>' if webp else img)
    parti.append(f'<span class="ct-badge__titolo">{nome_sicuro}</span>')
    if quando:
        parti.append(f'<span class="ct-badge__data">{html.escape(quando)}</span>')
    parti.append(f'<span class="ct-badge__verifica">{VERIFICA[lingua]} →</span></a></li>')
    return "".join(parti)


def aggiorna_contatori(testo, conteggi):
    """I numeri della pagina (badge per ente) seguono i badge reali: senza questo
    passaggio un badge nuovo comparirebbe nella griglia con il contatore fermo."""
    return re.sub(
        r'(<[^>]*\bdata-conta="(\w+)"[^>]*>)\d+(</)',
        lambda m: f"{m.group(1)}{conteggi.get(m.group(2), 0)}{m.group(3)}",
        testo,
    )


def sostituisci_blocco(testo, indice_occorrenza, contenuto, percorso):
    """Sostituisce il contenuto fra la N-esima coppia di marcatori."""
    posizioni = [(m.start(), m.end()) for m in re.finditer(re.escape(INIZIO), testo)]
    fini = [(m.start(), m.end()) for m in re.finditer(re.escape(FINE), testo)]
    if len(posizioni) != len(fini) or indice_occorrenza >= len(posizioni):
        sys.exit(
            f"{percorso.name}: marcatori BADGE:INIZIO/BADGE:FINE mancanti o "
            f"sbilanciati (trovate {len(posizioni)} aperture e {len(fini)} chiusure). "
            f"Senza marcatori questo script non sa dove scrivere e non tira a indovinare."
        )
    # Dal 20/09/2026 la pagina ha un contenitore solo: un secondo blocco resterebbe
    # fermo ai badge del giorno in cui e' stato scritto, e nessuno lo noterebbe.
    if len(posizioni) > 1:
        sys.exit(
            f"{percorso.name}: trovate {len(posizioni)} coppie di marcatori, "
            f"attesa una sola. Se hai riaggiunto un secondo contenitore, questo "
            f"script va aggiornato insieme alla pagina."
        )
    inizio_fine = posizioni[indice_occorrenza][1]
    fine_inizio = fini[indice_occorrenza][0]
    return testo[:inizio_fine] + "\n" + contenuto + "\n        " + testo[fine_inizio:]


def main():
    tutti = ordina(carica(BADGE) + carica(BADGE_EXTRA))
    if not tutti:
        sys.exit("nessun badge da rendere: badges.json e badges-extra.json sono vuoti o assenti")

    # Un blocco solo, in cronologico decrescente. Dal 15/11/2026 la pagina usa una
    # griglia filtrabile e non piu' la fascia che scorre, quindi niente copia per il ciclo.
    for percorso, lingua in PAGINE:
        if not percorso.exists():
            sys.exit(f"pagina non trovata: {percorso}")
        testo = percorso.read_text(encoding="utf-8")
        originale = testo
        testo = sostituisci_blocco(testo, 0, "\n".join(card(b, lingua) for b in tutti), percorso)
        conteggi = {"tutti": len(tutti)}
        for b in tutti:
            conteggi[ente(b)] = conteggi.get(ente(b), 0) + 1
        testo = aggiorna_contatori(testo, conteggi)
        if testo != originale:
            percorso.write_text(testo, encoding="utf-8")
            print(f"{percorso.relative_to(RADICE)}: {len(tutti)} badge")
        else:
            print(f"{percorso.relative_to(RADICE)}: nessuna modifica")


if __name__ == "__main__":
    main()
