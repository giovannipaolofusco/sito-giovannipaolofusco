#!/usr/bin/env python3
"""Porta le immagini dei badge dentro il repository e riscrive badges.json con i
percorsi locali.

Senza questo passaggio badges.json conserva gli URL del CDN di Credly, e ogni
visitatore della pagina certificazioni apre otto connessioni verso un dominio di
terze parti prima di aver dato qualunque consenso. Il file scaricato torna a
contenere quegli URL a ogni esecuzione del workflow, quindi la riscrittura va
fatta lì dentro e non una volta sola a mano.

Le immagini vengono ridotte a LATO px: il foglio di stile le mostra a 110px, e un
PNG da 1200px costa dieci volte tanto senza che si veda alcuna differenza.
"""

import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

RADICE = Path(__file__).resolve().parents[2]
SORGENTE = RADICE / "badges.json"
CARTELLA_IMMAGINI = RADICE / "assets" / "img" / "badges"
PREFISSO_PUBBLICO = "/assets/img/badges"
LATO = 240
AGENTE = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
)


def slug(testo):
    testo = unicodedata.normalize("NFKD", testo).encode("ascii", "ignore").decode()
    testo = re.sub(r"[^a-zA-Z0-9]+", "-", testo).strip("-").lower()
    return testo[:60] or "badge"


def valore_immagine(badge):
    """Il percorso immagine attualmente scritto nel badge, remoto o gia' locale."""
    modello = badge.get("badge_template") or {}
    for contenitore, chiave in (
        (modello.get("image"), "url"),
        (modello, "image_url"),
        (badge.get("image"), "url"),
        (badge, "image_url"),
    ):
        if isinstance(contenitore, dict):
            valore = contenitore.get(chiave)
            if isinstance(valore, str) and valore:
                return valore
    return ""


def url_remoto(badge):
    valore = valore_immagine(badge)
    return valore if valore.startswith("http") else ""


def riscrivi(badge, percorso):
    modello = badge.get("badge_template")
    for contenitore, chiave in (
        (modello.get("image") if isinstance(modello, dict) else None, "url"),
        (modello, "image_url"),
        (badge.get("image"), "url"),
        (badge, "image_url"),
    ):
        if isinstance(contenitore, dict) and chiave in contenitore:
            contenitore[chiave] = percorso
    # Il percorso WebP viene scritto nel JSON, non ricavato dal PNG sostituendo
    # l'estensione: un <source type="image/webp"> che punta a un file inesistente
    # non ricade sul PNG, mostra un'immagine rotta. Se il campo non c'e', il
    # markup emette un <img> semplice.
    if isinstance(modello, dict):
        modello["image_webp"] = percorso.rsplit(".", 1)[0] + ".webp"


def sfoltisci(badge):
    """Tiene solo i campi che script.js legge davvero.

    La risposta di Credly porta con se' una cinquantina di campi per badge — foto
    profilo, badge correlati, endorsement — che il sito non mostra mai ma che
    contengono altri URL del CDN esterno. Restano innocui finche' nessuno li usa,
    ed e' esattamente questo il problema: sono una riapertura della falla a
    disposizione di chiunque tocchi il file fra un anno. Via anche il peso, che si
    scarica a ogni visita della pagina certificazioni.
    """
    modello = badge.get("badge_template") or {}
    ridotto = {
        "id": badge.get("id"),
        "issued_at_date": badge.get("issued_at_date"),
        "issued_at": badge.get("issued_at"),
        "badge_url": badge.get("badge_url"),
        "name": badge.get("name"),
        "image_url": badge.get("image_url"),
        "badge_template": {
            "name": modello.get("name"),
            "image": {"url": (modello.get("image") or {}).get("url")},
            "image_url": modello.get("image_url"),
            "image_webp": modello.get("image_webp"),
        },
    }
    ridotto["badge_template"] = {
        c: v for c, v in ridotto["badge_template"].items() if v is not None
    }
    return {chiave: valore for chiave, valore in ridotto.items() if valore is not None}


def scarica_e_ridimensiona(url, destinazione):
    richiesta = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(richiesta, timeout=30) as risposta:
        dati = risposta.read()
    immagine = Image.open(BytesIO(dati))
    if immagine.mode not in ("RGBA", "LA"):
        immagine = immagine.convert("RGBA")
    immagine.thumbnail((LATO, LATO), Image.LANCZOS)
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    immagine.save(destinazione, "PNG", optimize=True)
    # Variante WebP accanto al PNG. Il PNG resta come fallback
    # per i browser che non la supportano: e' quello che il tag <img> dentro
    # <picture> continua a referenziare.
    immagine.save(destinazione.with_suffix(".webp"), "WEBP", quality=82, method=6)


def main():
    if not SORGENTE.exists():
        sys.exit(f"badges.json non trovato in {SORGENTE}")

    try:
        documento = json.loads(SORGENTE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as errore:
        sys.exit(f"badges.json non e' un JSON valido: {errore}")

    badge = documento.get("data") if isinstance(documento, dict) else documento
    if not isinstance(badge, list):
        sys.exit("badges.json non contiene un elenco di badge")

    attesi = set()
    sfoltiti = []
    for voce in badge:
        remoto = url_remoto(voce)
        if remoto:
            nome = (voce.get("badge_template") or {}).get("name") or voce.get("id") or "badge"
            nome_file = f"{slug(nome)}.png"
            destinazione = CARTELLA_IMMAGINI / nome_file
            attesi.add(nome_file)
            if not destinazione.exists():
                try:
                    scarica_e_ridimensiona(remoto, destinazione)
                except (urllib.error.URLError, OSError) as errore:
                    sys.exit(f"download fallito per {remoto}: {errore}")
                print(f"scaricato {nome_file}")
            elif not destinazione.with_suffix(".webp").exists():
                # PNG gia' presente da un'esecuzione precedente alla variante
                # WebP: si converte dal file locale, senza ripassare da Credly.
                Image.open(destinazione).save(
                    destinazione.with_suffix(".webp"), "WEBP", quality=82, method=6
                )
                print(f"generata variante WebP per {nome_file}")
            riscrivi(voce, f"{PREFISSO_PUBBLICO}/{nome_file}")
        else:
            # Gia' localizzato da un'esecuzione precedente. Il nome va comunque
            # dichiarato fra gli attesi, altrimenti la pulizia degli orfani qui
            # sotto scambierebbe per residui tutte le immagini del sito e le
            # cancellerebbe alla seconda esecuzione dello script.
            gia_locale = valore_immagine(voce)
            if gia_locale.startswith(f"{PREFISSO_PUBBLICO}/"):
                nome_file = gia_locale.rsplit("/", 1)[-1]
                attesi.add(nome_file)
                destinazione = CARTELLA_IMMAGINI / nome_file
                if destinazione.exists() and not destinazione.with_suffix(".webp").exists():
                    Image.open(destinazione).save(
                        destinazione.with_suffix(".webp"), "WEBP", quality=82, method=6
                    )
                    print(f"generata variante WebP per {nome_file}")
                riscrivi(voce, gia_locale)
        sfoltiti.append(sfoltisci(voce))

    if isinstance(documento, dict):
        documento["data"] = sfoltiti
    else:
        documento = sfoltiti

    if CARTELLA_IMMAGINI.exists():
        radici_attese = {Path(n).stem for n in attesi}
        for presente in list(CARTELLA_IMMAGINI.glob("*.png")) + list(
            CARTELLA_IMMAGINI.glob("*.webp")
        ):
            if presente.stem not in radici_attese:
                presente.unlink()
                print(f"rimosso badge non piu' presente: {presente.name}")

    SORGENTE.write_text(
        json.dumps(documento, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"badges.json riscritto con {len(attesi)} immagini locali")


if __name__ == "__main__":
    main()
