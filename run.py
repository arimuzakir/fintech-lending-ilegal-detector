import os
import sys
import time
import webbrowser
import threading
import uvicorn

def open_browser():
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"\n[Browser] Membuka antarmuka web di: {url}")
    webbrowser.open(url)

def main():
    app_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(app_dir)
    sys.path.insert(0, app_dir)

    print("\n" + "="*70)
    print("  FINTECH LENDING ILEGAL DETECTOR - WEB REAL-TIME TESTING")
    print("  Model: IndoBERT Base Fine-Tuned (Akurasi: 96.60%, F1: 95.74%)")
    print("  Server URL: http://127.0.0.1:8000")
    print("  Tekan CTRL+C untuk menghentikan server")
    print("="*70 + "\n")

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
