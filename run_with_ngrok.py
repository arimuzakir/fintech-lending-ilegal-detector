import os
import sys
import time
import subprocess
import webbrowser
import threading
import json
import urllib.request

def start_ngrok_and_browser():
    time.sleep(2)
    print("\n[Ngrok] Memulai Ngrok tunnel pada port 8000...")
    ngrok_process = subprocess.Popen(["ngrok", "http", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(3)

    public_url = None
    for _ in range(10):
        try:
            req = urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels")
            data = json.loads(req.read().decode('utf-8'))
            tunnels = data.get('tunnels', [])
            for t in tunnels:
                if t.get('proto') == 'https':
                    public_url = t.get('public_url')
                    break
            if public_url:
                break
        except Exception:
            pass
        time.sleep(1)

    print("\n" + "="*70)
    print("  STATUS SERVER & TUNNEL NGROK ONLINE:")
    print("  Local URL   : http://127.0.0.1:8000")
    if public_url:
        print(f"  Public URL  : {public_url}")
        print("  Dokumentasi : " + public_url + "/docs")
        print("  (Aplikasi sekarang bisa diakses dari HP / Internet di mana saja!)")
        webbrowser.open(public_url)
    else:
        print("  Ngrok Web UI: http://127.0.0.1:4040")
        webbrowser.open("http://127.0.0.1:8000")
    print("="*70 + "\n")

def main():
    app_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(app_dir)
    sys.path.insert(0, app_dir)

    import uvicorn
    threading.Thread(target=start_ngrok_and_browser, daemon=True).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
