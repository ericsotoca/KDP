# Déploiement

Le déploiement est automatisé avec GitHub Actions via `.github/workflows/deploy.yml`.

Chaque push sur `main` déclenche la construction Vite (`npm run build`) puis la publication du dossier `dist` sur GitHub Pages.

Lancement manuel : onglet Actions → Deploy to GitHub Pages → Run workflow.
