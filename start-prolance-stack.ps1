# Démarre le backend ProLance-Communication-MS puis le front Angular (fenêtres séparées).
# Prérequis : JDK 17, Maven, Node.js, MySQL (bases prolance_user, prolance_message, etc.).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "ProLance-Communication-MS"
$front = Join-Path $root "Pi_4Sae-template"

$javaHome = $env:JAVA_HOME
if (-not $javaHome -or -not (Test-Path $javaHome)) {
    $cand = "$env:USERPROFILE\.jdks\jbr-17.0.14"
    if (Test-Path $cand) { $javaHome = $cand }
}
if (-not $javaHome) {
    Write-Host "Définissez JAVA_HOME (JDK 17)." -ForegroundColor Red
    exit 1
}

$mvn = Get-ChildItem "$env:USERPROFILE\.m2\wrapper\dists" -Recurse -Filter "mvn.cmd" -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $mvn) {
    $mvn = "mvn"
}

function Start-BackendWindow($name, $moduleDir) {
    $dir = Join-Path $backend $moduleDir
    if (-not (Test-Path $dir)) {
        Write-Host "Dossier introuvable: $dir" -ForegroundColor Red
        return
    }
    $cmd = @"
`$env:JAVA_HOME='$javaHome'
Set-Location '$dir'
& '$mvn' spring-boot:run
"@
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $cmd) -WindowStyle Normal
    Write-Host "Lancé: $name" -ForegroundColor Green
}

Write-Host "=== Backend (attendre ~30s entre chaque service pour Eureka) ===" -ForegroundColor Cyan
Start-BackendWindow "eureka-server" "eureka-server"
Start-Sleep -Seconds 12
Start-BackendWindow "user-service" "user-service"
Start-Sleep -Seconds 8
Start-BackendWindow "message-service" "message-service"
Start-Sleep -Seconds 8
Start-BackendWindow "dispute-service" "dispute-service"
Start-Sleep -Seconds 8
# Si le port 8080 est déjà pris par une autre gateway, cette étape échouera dans la fenêtre.
Start-BackendWindow "api-gateway (ProLance)" "api-gateway"

Write-Host "`n=== Front Angular (port 4200, proxy Eureka) ===" -ForegroundColor Cyan
$ngCmd = @"
Set-Location '$front'
npx --yes ng serve --port 4200 --proxy-config proxy.conf.json
"@
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $ngCmd) -WindowStyle Normal

Write-Host "`nURLs utiles:" -ForegroundColor Yellow
Write-Host "  Eureka     http://localhost:8761"
Write-Host "  Gateway    http://localhost:8080  (ou votre gateway Eureka existante)"
Write-Host "  Angular    http://localhost:4200"
Write-Host "`nComptes test: demo / demo12345  |  admin / admin123"
