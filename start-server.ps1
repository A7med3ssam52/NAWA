$ErrorActionPreference = "Stop"
$workDir = $PSScriptRoot
$port = 5173

$process = Start-Process -FilePath "node_modules\.bin\vite.cmd" -ArgumentList "preview --port $port --host 0.0.0.0" -WorkingDirectory $workDir -NoNewWindow -PassThru

Write-Output "Server started on http://localhost:$port"
Write-Output "Process ID: $($process.Id)"

# Keep the process alive
$process.WaitForExit()
