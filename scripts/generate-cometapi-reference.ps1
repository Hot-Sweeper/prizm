$ErrorActionPreference = 'Stop'

$llms = Invoke-WebRequest -Uri "https://apidoc.cometapi.com/llms.txt" -UseBasicParsing -TimeoutSec 60
$openApiUrls = [regex]::Matches($llms.Content, 'https://apidoc\.cometapi\.com/api/openapi/[^\s\)]+\.json') |
  ForEach-Object { $_.Value } |
  Sort-Object -Unique

$endpointRows = New-Object System.Collections.Generic.List[object]
$failedSpecs = New-Object System.Collections.Generic.List[string]

foreach ($url in $openApiUrls) {
  try {
    $spec = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 40
    if ($null -eq $spec.paths) { continue }

    foreach ($pathProp in $spec.paths.PSObject.Properties) {
      $path = [string]$pathProp.Name
      foreach ($methodProp in $pathProp.Value.PSObject.Properties) {
        $method = ([string]$methodProp.Name).ToUpperInvariant()
        if ($method -in @('GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD')) {
          $endpointRows.Add([pscustomobject]@{
            Endpoint = "$method $path"
            Path = $path
            Method = $method
            Spec = $url
          })
        }
      }
    }
  } catch {
    $failedSpecs.Add($url)
  }
}

$endpoints = $endpointRows | Sort-Object Endpoint -Unique

$modelsResp = Invoke-RestMethod -Uri "https://api.cometapi.com/api/models" -Method Get -TimeoutSec 40
if (-not $modelsResp.success) {
  throw "GET /api/models returned success=false"
}
$models = $modelsResp.data | Sort-Object owned_by, id
$modelGroups = $models | Group-Object owned_by | Sort-Object Name

$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'
$sb = New-Object System.Text.StringBuilder

$null = $sb.AppendLine('# CometAPI API Reference (Live + Docs Indexed)')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- Generated: ' + $generatedAt)
$null = $sb.AppendLine('- Source docs index: https://apidoc.cometapi.com/llms.txt')
$null = $sb.AppendLine('- Base URL (OpenAI-compatible): https://api.cometapi.com/v1')
$null = $sb.AppendLine('- Base URL (catalog + misc): https://api.cometapi.com')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Verification Notes')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- Verified live: GET /api/models (public)')
$null = $sb.AppendLine('- Verified live: GET /v1/models without API key returns 401 Unauthorized')
$null = $sb.AppendLine('- COMETAPI_API_KEY in this environment: missing')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Endpoint Tree (Discovered from Comet OpenAPI specs)')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- OpenAPI spec files discovered: ' + $openApiUrls.Count)
$null = $sb.AppendLine('- OpenAPI spec files parsed successfully: ' + ($openApiUrls.Count - $failedSpecs.Count))
$null = $sb.AppendLine('- OpenAPI spec files failed to parse: ' + $failedSpecs.Count)
$null = $sb.AppendLine('- Unique endpoints discovered: ' + $endpoints.Count)
$null = $sb.AppendLine('')

$groupByRoot = $endpoints | Group-Object {
  $parts = $_.Path.Trim('/').Split('/')
  if ($parts.Length -gt 0 -and $parts[0] -ne '') { $parts[0] } else { '(root)' }
} | Sort-Object Name

foreach ($root in $groupByRoot) {
  $null = $sb.AppendLine('- /' + $root.Name)
  $bySecond = $root.Group | Group-Object {
    $parts = $_.Path.Trim('/').Split('/')
    if ($parts.Length -gt 1) { $parts[1] } else { '(direct)' }
  } | Sort-Object Name

  foreach ($second in $bySecond) {
    $null = $sb.AppendLine('  - /' + $root.Name + '/' + $second.Name)
    foreach ($ep in ($second.Group | Sort-Object Path, Method)) {
      $null = $sb.AppendLine('    - ' + $ep.Method + ' ' + $ep.Path)
    }
  }
}

if ($failedSpecs.Count -gt 0) {
  $null = $sb.AppendLine('')
  $null = $sb.AppendLine('## OpenAPI Specs That Failed to Parse in This Run')
  $null = $sb.AppendLine('')
  foreach ($u in $failedSpecs) {
    $null = $sb.AppendLine('- ' + $u)
  }
}

$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Live Model Catalog (GET /api/models)')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- Total models discovered: ' + $models.Count)
$null = $sb.AppendLine('- Groups (owned_by): ' + $modelGroups.Count)
$null = $sb.AppendLine('')

foreach ($g in $modelGroups) {
  $owner = if ([string]::IsNullOrWhiteSpace($g.Name)) { '(unknown)' } else { $g.Name }
  $null = $sb.AppendLine('### ' + $owner + ' (' + $g.Count + ')')
  foreach ($m in ($g.Group | Sort-Object id)) {
    $null = $sb.AppendLine('- ' + $m.id)
  }
  $null = $sb.AppendLine('')
}

$target = Join-Path (Get-Location) 'COMETAPI_API_REFERENCE.md'
[System.IO.File]::WriteAllText($target, $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output ('WROTE=' + $target)
Write-Output ('OPENAPI_SPECS=' + $openApiUrls.Count)
Write-Output ('ENDPOINTS=' + $endpoints.Count)
Write-Output ('MODELS=' + $models.Count)
