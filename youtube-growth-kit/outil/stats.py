#!/usr/bin/env python3
"""
Outil de suivi de stats pour une chaîne YouTube — LECTURE SEULE.

Utilise l'API officielle YouTube Data v3 pour AFFICHER les statistiques
publiques d'une chaîne (vues, abonnés, vidéos). Il ne modifie rien et n'ajoute
aucune vue : c'est un outil d'analyse pour décider quel contenu refaire.

Usage:
    pip install requests
    export YOUTUBE_API_KEY="votre_cle"
    python stats.py            # utilise CHANNEL_ID ci-dessous
    python stats.py UCxxxx     # ou passe l'ID de chaîne en argument
"""

import os
import sys
import requests

API = "https://www.googleapis.com/youtube/v3"

# Mets l'ID de la chaîne ici (commence par "UC..."), ou passe-le en argument.
CHANNEL_ID = "REMPLACE_PAR_L_ID_DE_LA_CHAINE"

# Nombre de dernières vidéos à analyser
NB_VIDEOS = 10


def get_key() -> str:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        sys.exit(
            "❌ Clé API manquante. Fais :  export YOUTUBE_API_KEY=\"ta_cle\"\n"
            "   (voir 06-outil-analyse.md pour l'obtenir gratuitement)"
        )
    return key


def get_json(path: str, params: dict) -> dict:
    resp = requests.get(f"{API}/{path}", params=params, timeout=20)
    if resp.status_code != 200:
        sys.exit(f"❌ Erreur API ({resp.status_code}) : {resp.text[:300]}")
    return resp.json()


def channel_stats(key: str, channel_id: str) -> dict:
    data = get_json(
        "channels",
        {"part": "snippet,statistics,contentDetails", "id": channel_id, "key": key},
    )
    items = data.get("items")
    if not items:
        sys.exit("❌ Chaîne introuvable. Vérifie l'ID (il commence par 'UC').")
    return items[0]


def recent_videos(key: str, uploads_playlist: str, n: int) -> list:
    pl = get_json(
        "playlistItems",
        {
            "part": "contentDetails",
            "playlistId": uploads_playlist,
            "maxResults": n,
            "key": key,
        },
    )
    ids = [it["contentDetails"]["videoId"] for it in pl.get("items", [])]
    if not ids:
        return []
    vids = get_json(
        "videos",
        {"part": "snippet,statistics", "id": ",".join(ids), "key": key},
    )
    return vids.get("items", [])


def fmt(n) -> str:
    try:
        return f"{int(n):,}".replace(",", " ")
    except (ValueError, TypeError):
        return str(n)


def main() -> None:
    key = get_key()
    channel_id = sys.argv[1] if len(sys.argv) > 1 else CHANNEL_ID
    if channel_id.startswith("REMPLACE"):
        sys.exit("❌ Mets l'ID de la chaîne dans CHANNEL_ID, ou passe-le en argument.")

    ch = channel_stats(key, channel_id)
    stats = ch["statistics"]
    title = ch["snippet"]["title"]
    uploads = ch["contentDetails"]["relatedPlaylists"]["uploads"]

    print("\n" + "=" * 48)
    print(f"📺  {title}")
    print("=" * 48)
    print(f"👥 Abonnés    : {fmt(stats.get('subscriberCount', 'caché'))}")
    print(f"👁️  Vues total : {fmt(stats.get('viewCount', 0))}")
    print(f"🎬 Vidéos     : {fmt(stats.get('videoCount', 0))}")

    vids = recent_videos(key, uploads, NB_VIDEOS)
    if not vids:
        print("\n(Aucune vidéo trouvée.)")
        return

    print(f"\n🔎 {len(vids)} dernières vidéos (triées par vues) :\n")
    rows = []
    for v in vids:
        s = v["statistics"]
        rows.append(
            (
                int(s.get("viewCount", 0)),
                int(s.get("likeCount", 0)),
                int(s.get("commentCount", 0)),
                v["snippet"]["title"],
            )
        )
    rows.sort(reverse=True)

    print(f"{'Vues':>8}  {'Likes':>6}  {'Comm.':>6}  Titre")
    print("-" * 60)
    for views, likes, comments, vtitle in rows:
        short = (vtitle[:45] + "…") if len(vtitle) > 46 else vtitle
        print(f"{fmt(views):>8}  {fmt(likes):>6}  {fmt(comments):>6}  {short}")

    best = rows[0]
    print(
        f"\n⭐ Vidéo la plus vue : « {best[3]} » ({fmt(best[0])} vues).\n"
        f"   → Analyse ce qui a marché (sujet, titre, miniature) et refais du "
        f"même genre !\n"
    )


if __name__ == "__main__":
    main()
