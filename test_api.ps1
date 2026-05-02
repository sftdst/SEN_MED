$ErrorActionPreference = 'Stop'
try {
    $result = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v1/personnels' -Method Get -TimeoutSec 10 -UseBasicParsing
    Write-Output "Status: $($result.StatusCode)"
    Write-Output "Content: $($result.Content)"
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Output "Status: $($statusCode)"
        Write-Output "Error Response: $errorBody"
    } else {
        Write-Output "Error: $($_.Exception.Message)"
    }
}
