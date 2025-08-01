# Install virtual-display-rs driver for GitHub Actions Windows runners

param(
    [Parameter(Mandatory=$true)]
    [string]$DriverPath,
    
    [Parameter(Mandatory=$true)]
    [string]$NefconPath
)

Push-Location $DriverPath

try {
    # Install certificates
    & certutil -addstore -f root "DriverCertificate.cer" | Out-Null
    & certutil -addstore -f TrustedPublisher "DriverCertificate.cer" | Out-Null
    
    # Install driver
    & $NefconPath --remove-device-node --hardware-id Root\VirtualDisplayDriver --class-guid "4D36E968-E325-11CE-BFC1-08002BE10318" | Out-Null
    & $NefconPath --create-device-node --class-name Display --class-guid "4D36E968-E325-11CE-BFC1-08002BE10318" --hardware-id Root\VirtualDisplayDriver | Out-Null
    & $NefconPath --install-driver --inf-path ".\VirtualDisplayDriver.inf" | Out-Null
    
    # Create virtual display
    & ".\virtual-display-driver-cli.exe" add "1920x1080@60" | Out-Null
    
    # Start user session service
    Start-Process -FilePath ".\vdd-user-session-service.exe" -WindowStyle Hidden | Out-Null
    
} finally {
    Pop-Location
}