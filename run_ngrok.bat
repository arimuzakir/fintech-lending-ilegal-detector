@echo off
title Deteksi Otomatis Fintech Lending Ilegal (Online via Ngrok)
echo ======================================================================
echo   APLIKASI DETEKSI OTOMATIS FINTECH LENDING ILEGAL (NGROK TUNNEL)
echo   Model: Multi-Model NLP (IndoBERT, BERT, Tweet, Baseline)
echo ======================================================================
echo.
echo Menjalankan aplikasi dengan tunnel publik Ngrok...
cd /d "%~dp0"
python run_ngrok.py
pause
