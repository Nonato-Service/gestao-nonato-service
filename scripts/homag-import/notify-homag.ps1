param(
  [Parameter(Mandatory = $true)][string]$Title,
  [Parameter(Mandatory = $true)][string]$Message
)

function Escape-Xml([string]$text) {
  if ($null -eq $text) { return '' }
  return [Security.SecurityElement]::Escape($text)
}

$titleXml = Escape-Xml $Title
$msgXml = Escape-Xml $Message

try {
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

  $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
  $xml.LoadXml(@"
<toast duration="long" activationType="foreground">
  <visual>
    <binding template="ToastGeneric">
      <text>$titleXml</text>
      <text>$msgXml</text>
    </binding>
  </visual>
  <audio silent="true"/>
</toast>
"@)

  $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('NONATO Service HOMAG').Show($toast)
  exit 0
} catch {
  Write-Host ""
  Write-Host "=== $Title ==="
  Write-Host $Message
  Write-Host ""
  exit 0
}
