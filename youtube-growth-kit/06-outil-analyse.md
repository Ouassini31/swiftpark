# 06 — (Optionnel) Petit outil pour suivre les stats

> Ceci utilise l'**API officielle YouTube Data v3** de Google. C'est 100 %
> autorisé : ça ne fait que **lire** des statistiques publiques (vues, likes,
> abonnés), ça n'ajoute rien artificiellement. C'est l'inverse d'un bot.

## À quoi ça sert

Suivre l'évolution de la chaîne au même endroit, et voir **quelles vidéos
marchent le mieux** pour en refaire du même genre. Prendre des décisions sur des
vraies données plutôt qu'au feeling.

## Étape 1 — Obtenir une clé API gratuite

1. Va sur https://console.cloud.google.com/
2. Crée un projet (bouton en haut, « Nouveau projet »).
3. Dans « APIs & Services » → « Bibliothèque », cherche **YouTube Data API v3**
   et clique sur **Activer**.
4. Dans « APIs & Services » → « Identifiants », crée une **clé API**.
5. Copie la clé. **Ne la partage jamais publiquement** (ne pas la mettre sur
   GitHub).

## Étape 2 — Le script

Un petit script Python (`stats.py`) est fourni dans le sous-dossier `outil/`.
Il affiche les stats de la chaîne et de ses dernières vidéos.

```bash
cd youtube-growth-kit/outil
pip install requests
export YOUTUBE_API_KEY="ta_cle_ici"
python stats.py
```

## Étape 3 — Trouver l'ID de la chaîne

Sur la page de la chaîne YouTube, l'ID est dans l'URL
(`youtube.com/channel/UCxxxxxxxx`) ou visible dans les paramètres avancés de
YouTube Studio. Mets-le dans le script (variable `CHANNEL_ID`).

## Ce que ça affiche

- Nombre total de vues / abonnés / vidéos de la chaîne
- Les X dernières vidéos avec leurs vues, likes, commentaires
- Ça aide à repérer **le format qui marche** → à refaire !

## ⚠️ Rappel

Cet outil ne fait que **lire** des chiffres publics. Il n'existe aucune façon
légitime d'« ajouter des vues » via l'API — Google le détecte et sanctionne. La
seule croissance qui dure, c'est celle des vrais spectateurs. Tout le reste de
ce kit est là pour ça. 💪
