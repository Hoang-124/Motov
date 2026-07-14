$port = 27017
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "✅ MongoDB is already running on port $port."
    exit 0
}

Write-Host "🔄 MongoDB is not running. Attempting to start it..."

# Try to get the path from MongoDB Windows Service
$service = Get-CimInstance Win32_Service -Filter "Name = 'MongoDB'" -ErrorAction SilentlyContinue
$mongodPath = $null

if ($service -and $service.PathName) {
    # Extract path between quotes
    if ($service.PathName -match '"([^"]+)"') {
        $mongodPath = $Matches[1]
    } else {
        $mongodPath = $service.PathName.Split(' ')[0]
    }
}

if (-not $mongodPath) {
    # Fallback to default paths
    $defaultPaths = @(
        "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe",
        "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe",
        "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
        "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
    )
    foreach ($path in $defaultPaths) {
        if (Test-Path $path) {
            $mongodPath = $path
            break
        }
    }
}

if (-not $mongodPath) {
    # Check if mongod is in PATH
    $mongodPath = Get-Command mongod -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
}

if ($mongodPath -and (Test-Path $mongodPath)) {
    Write-Host "🚀 Starting MongoDB using: $mongodPath"
    # Ensure .mongodb_data directory exists
    $dbPath = Join-Path (Get-Location) ".mongodb_data"
    if (-not (Test-Path $dbPath)) {
        New-Item -ItemType Directory -Path $dbPath | Out-Null
    }
    
    # Start mongod in background
    Start-Process -FilePath $mongodPath -ArgumentList "--dbpath `"$dbPath`" --port $port" -WindowStyle Hidden
    
    # Wait for it to start listening
    $timeout = 10
    while ($timeout -gt 0) {
        Start-Sleep -Seconds 1
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
            Write-Host "✅ MongoDB started successfully!"
            exit 0
        }
        $timeout--
    }
    Write-Warning "⚠️ MongoDB started but is not listening on port $port yet."
} else {
    Write-Error "❌ Could not find mongod.exe. Please install MongoDB or make sure it is in your PATH."
    exit 1
}
