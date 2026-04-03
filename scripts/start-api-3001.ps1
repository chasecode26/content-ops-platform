$ErrorActionPreference = 'Stop'
Set-Location 'D:\git\content-ops-platform\apps\api-server'
$env:PORT = '3001'
& 'D:\codeSoft\nodejs\node_global\pnpm.cmd' run 'start:dev' *>> 'D:\git\content-ops-platform\.tmp-api-runtime-3001.log'
