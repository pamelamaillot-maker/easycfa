# reduire-logos.ps1
# Reduit les logos PAM OI de 3000x2295 px a 600x459 px.
#
# POURQUOI
# @react-pdf/renderer decode chaque image en memoire avant de l'inserer dans le
# PDF. Une image de 3000x2295 occupe 27,5 Mo une fois decodee (largeur x hauteur
# x 4 octets), quel que soit son poids sur le disque. Plusieurs generations de
# PDF d'affilee saturent la memoire de l'onglet : "Array buffer allocation failed".
#
# A 300 dpi, un logo de 5 cm de large n'a besoin que de 590 px.
# 600x459 occupe 1,1 Mo en memoire, soit 25 fois moins.
#
# SECURITE
# Chaque original est copie en <nom>.png.original avant remplacement.
# Pour revenir en arriere : renommer le .original en .png.
#
# UTILISATION
# Placer ce fichier a la racine du projet, puis dans un terminal PowerShell :
#   powershell -ExecutionPolicy Bypass -File .\reduire-logos.ps1

Add-Type -AssemblyName System.Drawing

$LARGEUR_CIBLE = 600
$NOMS = @('logo-pamoi-PNG.png', 'logo-pamoi.png', 'logo-pam-oi.png')

Write-Host ""
Write-Host "Reduction des logos PAM OI" -ForegroundColor Cyan
Write-Host ""

$fichiers = Get-ChildItem . -Recurse -File |
    Where-Object { $NOMS -contains $_.Name -and $_.FullName -notmatch 'node_modules|\.next' }

if ($fichiers.Count -eq 0) {
    Write-Host "Aucun logo trouve. Etes-vous bien a la racine du projet ?" -ForegroundColor Yellow
    exit
}

foreach ($f in $fichiers) {
    $chemin = $f.FullName

    # On charge les octets en memoire : FromFile verrouillerait le fichier
    # et empecherait de le reecrire au meme emplacement.
    $octets = [IO.File]::ReadAllBytes($chemin)
    $flux = New-Object IO.MemoryStream(, $octets)
    $source = [System.Drawing.Image]::FromStream($flux)

    $largeurInitiale = $source.Width
    $hauteurInitiale = $source.Height

    if ($largeurInitiale -le $LARGEUR_CIBLE) {
        Write-Host "  $($f.Name) : deja a $largeurInitiale px, ignore." -ForegroundColor DarkGray
        $source.Dispose(); $flux.Dispose()
        continue
    }

    $largeur = $LARGEUR_CIBLE
    $hauteur = [int][Math]::Round($hauteurInitiale * $LARGEUR_CIBLE / $largeurInitiale)

    # Format32bppArgb : conserve le canal de transparence du PNG.
    $cible = New-Object System.Drawing.Bitmap $largeur, $hauteur, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($cible)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($source, 0, 0, $largeur, $hauteur)
    $g.Dispose()

    $source.Dispose()
    $flux.Dispose()

    # Sauvegarde de l'original, une seule fois : on n'ecrase jamais une
    # sauvegarde existante, sans quoi un second passage la detruirait.
    $sauvegarde = "$chemin.original"
    if (-not (Test-Path $sauvegarde)) {
        [IO.File]::WriteAllBytes($sauvegarde, $octets)
    }

    $cible.Save($chemin, [System.Drawing.Imaging.ImageFormat]::Png)
    $cible.Dispose()

    $poids = [int]((Get-Item $chemin).Length / 1KB)
    $memoireAvant = [Math]::Round($largeurInitiale * $hauteurInitiale * 4 / 1MB, 1)
    $memoireApres = [Math]::Round($largeur * $hauteur * 4 / 1MB, 1)

    Write-Host "  $($f.Name)" -ForegroundColor Green
    Write-Host "    $largeurInitiale x $hauteurInitiale  ->  $largeur x $hauteur px ($poids Ko)"
    Write-Host "    memoire : $memoireAvant Mo  ->  $memoireApres Mo"
}

Write-Host ""
Write-Host "Termine. Les originaux sont conserves en .png.original" -ForegroundColor Cyan
Write-Host ""
