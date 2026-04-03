@echo off
setlocal
cd /d D:\git\content-ops-platform\apps\web-admin
set VITE_PROXY_TARGET=http://127.0.0.1:3001
D:\codeSoft\nodejs\node_global\pnpm.cmd run preview -- --host 127.0.0.1 --port 8090 >> D:\git\content-ops-platform\.tmp-web-preview-8090.log 2>> D:\git\content-ops-platform\.tmp-web-preview-8090.err.log
