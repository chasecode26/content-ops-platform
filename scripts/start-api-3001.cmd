@echo off
setlocal
cd /d D:\git\content-ops-platform\apps\api-server
set PORT=3001
D:\codeSoft\nodejs\node_global\pnpm.cmd run start:dev >> D:\git\content-ops-platform\.tmp-api-runtime-3001.log 2>> D:\git\content-ops-platform\.tmp-api-runtime-3001.err.log
