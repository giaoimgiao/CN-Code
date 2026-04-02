# One-off: point User-level proxy at Clash Verge mixed port; remove stale ALL_PROXY.
[Environment]::SetEnvironmentVariable('HTTP_PROXY', 'http://127.0.0.1:7898', 'User')
[Environment]::SetEnvironmentVariable('HTTPS_PROXY', 'http://127.0.0.1:7898', 'User')
[Environment]::SetEnvironmentVariable('ALL_PROXY', $null, 'User')
[Environment]::SetEnvironmentVariable('all_proxy', $null, 'User')
Write-Host 'User HTTP_PROXY =' ([Environment]::GetEnvironmentVariable('HTTP_PROXY', 'User'))
Write-Host 'User HTTPS_PROXY =' ([Environment]::GetEnvironmentVariable('HTTPS_PROXY', 'User'))
Write-Host 'User ALL_PROXY =' ([Environment]::GetEnvironmentVariable('ALL_PROXY', 'User'))
Write-Host 'Restart Cursor/terminal to pick up new User env.'
