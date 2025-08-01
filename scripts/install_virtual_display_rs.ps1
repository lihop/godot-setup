# Install virtual-display-rs driver for GitHub Actions Windows runners
# Requires elevated privileges

param(
    [Parameter(Mandatory=$true)]
    [string]$DriverPath,
    
    [Parameter(Mandatory=$true)]
    [string]$NefconPath
)

Write-Host "Installing virtual-display-rs driver..."
Write-Host "Driver path: $DriverPath"
Write-Host "Nefcon path: $NefconPath"

# Verify driver path exists
if (-not (Test-Path $DriverPath)) {
    throw "Driver path does not exist: $DriverPath"
}

# Verify nefcon executable exists
if (-not (Test-Path $NefconPath)) {
    throw "nefconc.exe not found at: $NefconPath"
}
$NefconFullPath = $NefconPath

# Change to driver directory
Push-Location $DriverPath

try {
    # Install certificate first
    Write-Host "Installing driver certificate..."
    
    if (Test-Path "DriverCertificate.cer") {
        Write-Host "Installing certificate to Root store..."
        & certutil -addstore -f root "DriverCertificate.cer"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install certificate to Root store"
        }
        
        Write-Host "Installing certificate to TrustedPublisher store..."
        & certutil -addstore -f TrustedPublisher "DriverCertificate.cer"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install certificate to TrustedPublisher store"
        }
        
        Write-Host "Certificate installed successfully"
    } else {
        Write-Warning "DriverCertificate.cer not found in driver package"
    }
    
    # Remove existing device node if present
    Write-Host "Removing existing device node..."
    & $NefconFullPath --remove-device-node --hardware-id Root\VirtualDisplayDriver --class-guid "4D36E968-E325-11CE-BFC1-08002BE10318"
    
    # Create device node
    Write-Host "Creating device node..."
    & $NefconFullPath --create-device-node --class-name Display --class-guid "4D36E968-E325-11CE-BFC1-08002BE10318" --hardware-id Root\VirtualDisplayDriver
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create device node"
    }
    
    # Install driver
    Write-Host "Installing driver..."
    & $NefconFullPath --install-driver --inf-path ".\VirtualDisplayDriver.inf"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install driver"
    }
    
    Write-Host "Driver installation completed successfully!"
    
    # DEBUG: Check what's in the driver directory
    Write-Host "DEBUG: Contents of driver directory:"
    Get-ChildItem -Path . | Format-Table -AutoSize
    
    # Find virtual-display-driver-cli.exe
    $VirtualDisplayCli = ".\virtual-display-driver-cli.exe"
    if (Test-Path $VirtualDisplayCli) {
        Write-Host "Found virtual-display-driver-cli.exe, checking help..."
        
        # DEBUG: Show help for the CLI
        Write-Host "DEBUG: virtual-display-driver-cli.exe --help output:"
        & $VirtualDisplayCli --help
        
        # DEBUG: Show help for the add command specifically
        Write-Host "DEBUG: virtual-display-driver-cli.exe add --help output:"
        & $VirtualDisplayCli add --help
        
        # Create a virtual display (try different formats)
        Write-Host "Creating virtual display (1920x1080 @ 60Hz)..."
        
        # Try format: WIDTHxHEIGHT@REFRESH
        Write-Host "Trying format: 1920x1080@60"
        & $VirtualDisplayCli add "1920x1080@60"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "First format failed, trying: 1920x1080"
            & $VirtualDisplayCli add "1920x1080"
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Second format failed, trying with --id parameter"
            & $VirtualDisplayCli add --id 1
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ID format failed, trying with --name parameter"
            & $VirtualDisplayCli add --name "Virtual Display 1"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Virtual display created successfully!"
        } else {
            Write-Warning "All virtual display creation attempts failed (exit code: $LASTEXITCODE)"
        }
        
        # List virtual displays
        Write-Host "Listing virtual displays:"
        & $VirtualDisplayCli list
        
    } else {
        Write-Warning "virtual-display-driver-cli.exe not found in driver directory"
    }
    
    # List all Windows displays
    Write-Host "DEBUG: All Windows display devices:"
    Get-WmiObject -Class Win32_VideoController | Select-Object Name, Status, VideoModeDescription, CurrentHorizontalResolution, CurrentVerticalResolution | Format-Table -AutoSize
    
    # List display configuration
    Write-Host "DEBUG: Display configuration:"
    Get-DisplayResolution | Format-Table -AutoSize
    
} catch {
    Write-Error "Installation failed: $_"
    exit 1
} finally {
    Pop-Location
}

Write-Host "Installation complete!"