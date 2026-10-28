[CmdletBinding()]
param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$publicRuntimeRules = @(Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
    Where-Object {
        $_.Profile -eq 'Public' -and
        $_.DisplayName -in @('Python', 'Node.js JavaScript Runtime')
    })

if (-not $Apply) {
    Get-NetTCPConnection -State Listen |
        Where-Object { $_.LocalPort -in @(3306, 33060, 3000, 4001) } |
        Select-Object LocalAddress, LocalPort, OwningProcess
    $publicRuntimeRules | Select-Object Name, DisplayName, Profile, Enabled
    Write-Output 'Read-only check. Run this script with -Apply from an Administrator PowerShell to apply the firewall rules.'
    return
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Administrator PowerShell is required. No firewall change was made.'
}

# Keep the previous rule state outside the repository for a deliberate rollback.
$backupDir = Join-Path $env:LOCALAPPDATA 'trading-security'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$backupFile = Join-Path $backupDir ('firewall-before-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$publicRuntimeRules | Select-Object Name, DisplayName, Profile, Enabled |
    ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $backupFile

$blockName = 'TradingSecurity-BlockRemoteMySQL'
if (-not (Get-NetFirewallRule -Name $blockName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name $blockName -DisplayName 'Trading security: block remote MySQL' `
        -Direction Inbound -Action Block -Protocol TCP -LocalPort 3306,33060 -Profile Any | Out-Null
}
$publicRuntimeRules | Disable-NetFirewallRule | Out-Null
Get-NetFirewallRule -Name $blockName | Select-Object Name, Enabled, Action
Write-Output "Previous public runtime rule state saved to $backupFile"
Write-Output 'Rollback: remove TradingSecurity-BlockRemoteMySQL and re-enable only rule names recorded in that backup.'
