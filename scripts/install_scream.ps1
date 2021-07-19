<# Script to install Scream, a dummy sound card for Windows: https://github.com/duncanthrax/scream
Taken from comment by Aleksandr Chebotov (al-cheb) at: https://github.com/actions/virtual-environments/issues/2528#issuecomment-766883233 #>
Start-Service audio*
Invoke-WebRequest https://github.com/duncanthrax/scream/releases/download/3.6/Scream3.6.zip -OutFile C:\Scream3.6.zip
Extract-7Zip -Path C:\Scream3.6.zip -DestinationPath C:\Scream
$cert = (Get-AuthenticodeSignature C:\Scream\Install\driver\Scream.sys).SignerCertificate
$store = [System.Security.Cryptography.X509Certificates.X509Store]::new("TrustedPublisher", "LocalMachine")
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()
cd C:\Scream\Install\driver
C:\Scream\Install\helpers\devcon install Scream.inf *Scream
