$ErrorActionPreference = 'Stop'

function Add-SchemaProperties {
  param(
    [Parameter(Mandatory = $true)] $Schema,
    [Parameter(Mandatory = $true)] [string] $Prefix,
    [Parameter(Mandatory = $true)] [System.Collections.Generic.List[object]] $Rows
  )

  if ($null -eq $Schema) { return }

  if ($Schema.properties) {
    foreach ($prop in $Schema.properties.PSObject.Properties) {
      $name = [string]$prop.Name
      $value = $prop.Value
      $path = if ([string]::IsNullOrWhiteSpace($Prefix)) { $name } else { "$Prefix.$name" }

      $enumText = $null
      if ($value.enum) {
        $enumText = (($value.enum | ForEach-Object { [string]$_ }) -join ', ')
      }

      $Rows.Add([pscustomobject]@{
        Name = $path
        Type = [string]$value.type
        Required = $false
        Enum = $enumText
        Description = [string]$value.description
      })

      Add-SchemaProperties -Schema $value -Prefix $path -Rows $Rows
    }
  }

  if ($Schema.items) {
    Add-SchemaProperties -Schema $Schema.items -Prefix ($Prefix + '[]') -Rows $Rows
  }
}

$llms = Invoke-WebRequest -Uri "https://apidoc.cometapi.com/llms.txt" -UseBasicParsing -TimeoutSec 60
$openApiUrls = [regex]::Matches($llms.Content, 'https://apidoc\.cometapi\.com/api/openapi/(image|video)/[^\s\)]+\.json') |
  ForEach-Object { $_.Value } |
  Sort-Object -Unique

$endpointSummaries = New-Object System.Collections.Generic.List[object]
$optionInventory = @{}

foreach ($url in $openApiUrls) {
  try {
    $spec = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 40
    if ($null -eq $spec.paths) { continue }

    foreach ($pathProp in $spec.paths.PSObject.Properties) {
      $path = [string]$pathProp.Name
      foreach ($methodProp in $pathProp.Value.PSObject.Properties) {
        $method = ([string]$methodProp.Name).ToUpperInvariant()
        if ($method -notin @('GET','POST','PUT','PATCH','DELETE')) { continue }

        $op = $methodProp.Value
        $rows = New-Object System.Collections.Generic.List[object]

        if ($op.parameters) {
          foreach ($param in $op.parameters) {
            $enumText = $null
            if ($param.schema -and $param.schema.enum) {
              $enumText = (($param.schema.enum | ForEach-Object { [string]$_ }) -join ', ')
            }
            $rows.Add([pscustomobject]@{
              Name = [string]$param.name
              Type = if ($param.schema) { [string]$param.schema.type } else { '' }
              Required = [bool]$param.required
              Enum = $enumText
              Description = ('[' + [string]$param.in + '] ' + [string]$param.description)
            })
          }
        }

        if ($op.requestBody -and $op.requestBody.content) {
          $contentProps = $op.requestBody.content.PSObject.Properties
          if ($contentProps.Count -gt 0) {
            $schema = $contentProps[0].Value.schema
            Add-SchemaProperties -Schema $schema -Prefix '' -Rows $rows

            if ($schema.required) {
              $requiredNames = @($schema.required | ForEach-Object { [string]$_ })
              foreach ($row in $rows) {
                if ($requiredNames -contains $row.Name) {
                  $row.Required = $true
                }
              }
            }
          }
        }

        $uniqueRows = $rows | Sort-Object Name -Unique
        $endpointSummaries.Add([pscustomobject]@{
          Method = $method
          Path = $path
          Url = $url
          Summary = [string]$op.summary
          Description = [string]$op.description
          Options = $uniqueRows
        })

        foreach ($row in $uniqueRows) {
          if (-not $optionInventory.ContainsKey($row.Name)) {
            $optionInventory[$row.Name] = New-Object System.Collections.Generic.List[string]
          }
          $optionInventory[$row.Name].Add("$method $path")
        }
      }
    }
  } catch {
    # ignore bad specs and continue
  }
}

$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + ' UTC'
$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine('# CometAPI Image and Video Options Reference (Docs Derived)')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- Generated: ' + $generatedAt)
$null = $sb.AppendLine('- Source: OpenAPI specs linked from https://apidoc.cometapi.com/llms.txt')
$null = $sb.AppendLine('- OpenAPI files scanned: ' + $openApiUrls.Count)
$null = $sb.AppendLine('- Endpoints summarized: ' + $endpointSummaries.Count)
$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Notes')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('- This file is docs-derived, not a live capability probe.')
$null = $sb.AppendLine('- Comet exposes multiple provider-specific endpoint families, so supported fields vary by endpoint and model.')
$null = $sb.AppendLine('- If a field does not show an enum here, it usually means the docs describe it textually rather than enforcing a strict OpenAPI enum.')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Option Inventory')
$null = $sb.AppendLine('')

foreach ($key in ($optionInventory.Keys | Sort-Object)) {
  $endpoints = ($optionInventory[$key] | Sort-Object -Unique) -join '; '
  $null = $sb.AppendLine('- **' + $key + '**: ' + $endpoints)
}

$null = $sb.AppendLine('')
$null = $sb.AppendLine('## Endpoint Details')
$null = $sb.AppendLine('')

foreach ($ep in ($endpointSummaries | Sort-Object Path, Method)) {
  $null = $sb.AppendLine('### ' + $ep.Method + ' ' + $ep.Path)
  if (-not [string]::IsNullOrWhiteSpace($ep.Summary)) {
    $null = $sb.AppendLine('')
    $null = $sb.AppendLine('- Summary: ' + $ep.Summary)
  }
  if (-not [string]::IsNullOrWhiteSpace($ep.Url)) {
    $null = $sb.AppendLine('- Spec: ' + $ep.Url)
  }
  $null = $sb.AppendLine('')
  foreach ($opt in $ep.Options) {
    $line = '- **' + $opt.Name + '**'
    if (-not [string]::IsNullOrWhiteSpace($opt.Type)) {
      $line += ' (`' + $opt.Type + '`)'
    }
    if ($opt.Required) {
      $line += ' required'
    }
    $null = $sb.AppendLine($line)
    if (-not [string]::IsNullOrWhiteSpace($opt.Enum)) {
      $null = $sb.AppendLine('  - enum: ' + $opt.Enum)
    }
    if (-not [string]::IsNullOrWhiteSpace($opt.Description)) {
      $desc = $opt.Description.Replace("`r", ' ').Replace("`n", ' ')
      $null = $sb.AppendLine('  - ' + $desc)
    }
  }
  $null = $sb.AppendLine('')
}

$target = Join-Path (Get-Location) 'COMETAPI_IMAGE_VIDEO_OPTIONS.md'
[System.IO.File]::WriteAllText($target, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output ('WROTE=' + $target)
Write-Output ('ENDPOINTS=' + $endpointSummaries.Count)
Write-Output ('OPTIONS=' + $optionInventory.Keys.Count)
