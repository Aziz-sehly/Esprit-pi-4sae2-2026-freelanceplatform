# Instructions pour pousser le projet sur GitHub

## Branche : `mohamed-sadok-slimen-4sae2`

Exécuter ces commandes dans le dossier `Pi_4Sae-template` :

```bash
# 1. Initialiser Git (si pas déjà fait)
git init

# 2. Ajouter le remote
git remote add origin https://github.com/Aziz-sehly/Pi_4Sae.git

# 3. Créer et basculer sur la nouvelle branche
git checkout -b mohamed-sadok-slimen-4sae2

# 4. Ajouter tous les fichiers
git add .

# 5. Commit
git commit -m "ProLance - Messagerie et litiges - Mohamed Sadok Slimen 4SAE2"

# 6. Pousser vers GitHub
git push -u origin mohamed-sadok-slimen-4sae2
```

**Note :** Si le remote `origin` existe déjà, utiliser :
```bash
git remote set-url origin https://github.com/Aziz-sehly/Pi_4Sae.git
```

Si vous n'avez pas les droits d'écriture sur le repo Aziz-sehly/Pi_4Sae :
1. Forker le repo sur votre compte GitHub
2. Pousser vers votre fork
3. Créer une Pull Request vers le repo original
