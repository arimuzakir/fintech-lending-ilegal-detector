@echo off
title Deteksi Otomatis Fintech Lending Ilegal
echo ======================================================================
echo   APLIKASI DETEKSI OTOMATIS FINTECH LENDING ILEGAL
echo   Model: Multi-Model NLP (IndoBERT, BERT, Tweet, Baseline)
echo ======================================================================
echo.
echo Menjalankan server aplikasi...
cd /d "%~dp0"
python run.py
pause
