@echo off
echo Starting Smart Saloon Camera Service...
set /p SALOON_ID="Enter Saloon ID (default 1): "
if "%SALOON_ID%"=="" set SALOON_ID=1

set /p CAMERA_SOURCE="Enter RTSP URL or Camera Index (default 0): "
if "%CAMERA_SOURCE%"=="" set CAMERA_SOURCE=0

python run_camera.py %SALOON_ID% %CAMERA_SOURCE%
pause
