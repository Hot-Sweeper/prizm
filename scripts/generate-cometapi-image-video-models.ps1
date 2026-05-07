$ErrorActionPreference = 'Stop'

$response = Invoke-RestMethod -Uri "https://api.cometapi.com/api/models" -Method Get -TimeoutSec 60
if (-not $response.success) {
  throw "Comet models API returned success=false"
}

$allModels = $response.data
$filtered = $allModels | Where-Object { $_.model_type -in @('image', 'video') } | Sort-Object model_type, provider, id
$imageModels = $filtered | Where-Object { $_.model_type -eq 'image' }
$videoModels = $filtered | Where-Object { $_.model_type -eq 'video' }

$sb = New-Object System.Text.StringBuilder
$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'

$null = $sb.AppendLine('# CometAPI Image and Video Models (Live Catalog)')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- Generated: ' + $generatedAt)
$null = $sb.AppendLine('- Source: https://api.cometapi.com/api/models')
$null = $sb.AppendLine('- Total filtered models: ' + $filtered.Count)
$null = $sb.AppendLine('- Image models: ' + $imageModels.Count)
$null = $sb.AppendLine('- Video models: ' + $videoModels.Count)
$null = $sb.AppendLine('')

function Add-Section {
  param(
    [string]$Title,
    [array]$Models,
    [System.Text.StringBuilder]$Builder
  )

  $null = $Builder.AppendLine('## ' + $Title + ' (' + $Models.Count + ')')
  $null = $Builder.AppendLine('')

  $providerGroups = $Models | Group-Object provider | Sort-Object Name
  foreach ($group in $providerGroups) {
    $provider = if ([string]::IsNullOrWhiteSpace($group.Name)) { '(unknown)' } else { $group.Name }
    $null = $Builder.AppendLine('### ' + $provider + ' (' + $group.Count + ')')

    foreach ($model in ($group.Group | Sort-Object id)) {
      $features = if ($model.features) { ($model.features -join ', ') } else { '' }
      $pricing = ''
      if ($model.pricing -and $model.pricing.per_request) {
        $pricing = 'per_request=' + $model.pricing.per_request
      } elseif ($model.pricing -and $model.pricing.per_second) {
        $pricing = 'per_second=' + $model.pricing.per_second
      }

      $null = $Builder.AppendLine('- **' + $model.id + '**')
      $null = $Builder.AppendLine('  - name: ' + $model.name)
      $null = $Builder.AppendLine('  - type: ' + $model.model_type)
      if ($features -ne '') {
        $null = $Builder.AppendLine('  - features: ' + $features)
      }
      if ($model.api_doc_url) {
        $null = $Builder.AppendLine('  - api_doc_url: ' + $model.api_doc_url)
      }
      if ($pricing -ne '') {
        $null = $Builder.AppendLine('  - pricing: ' + $pricing)
      }
    }

    $null = $Builder.AppendLine('')
  }
}

Add-Section -Title 'Image Models' -Models $imageModels -Builder $sb
Add-Section -Title 'Video Models' -Models $videoModels -Builder $sb

$targetPath = Join-Path (Get-Location) 'COMETAPI_IMAGE_VIDEO_MODELS.md'
[System.IO.File]::WriteAllText($targetPath, $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output ('WROTE=' + $targetPath)
Write-Output ('IMAGE=' + $imageModels.Count)
Write-Output ('VIDEO=' + $videoModels.Count)
