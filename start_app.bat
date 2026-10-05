@echo off
echo ======================================================================
echo Starting Crime Scene Analysis & Forensic Reconstruction Full-Stack App
echo ======================================================================

echo [1/3] Starting FastAPI AI Inference Engine (Port 8008, AMD Hardware Acceleration)...
start "AI Service (FastAPI)" cmd /k "C:\Users\Mukeshkumar\miniforge3\envs\ryzen-ai-1.8.0\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8008" /D "%~dp0backend"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Express MERN Backend (Port 5000)...
start "Express MERN Server" cmd /k "node server.js" /D "%~dp0server"

timeout /t 2 /nobreak > nul

echo [3/3] Starting React Forensic Dashboard (Port 5173)...
start "React Dashboard (Vite)" cmd /k "npm.cmd run dev" /D "%~dp0frontend"

echo ======================================================================
echo All services launched!
echo - React Dashboard: http://localhost:5173
echo - Express MERN API: http://localhost:5000
echo - FastAPI AI Engine: http://127.0.0.1:8008
echo ======================================================================
pause
