import urllib.request
import time
import sys

url = "https://rubengp02.github.io/BotOS/index.html"
max_retries = 60 # 5 minutes max

print("Starting to poll GitHub Pages...")
for i in range(max_retries):
    try:
        req = urllib.request.Request(url, headers={'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                html = response.read().decode('utf-8')
                if "Datos Sintéticos" in html:
                    print("\n[SUCCESS] Site is live and updated!", flush=True)
                    sys.exit(0)
                else:
                    print(f"[{i}] Site is up but serving old cache. Waiting...", flush=True)
    except Exception as e:
        print(f"[{i}] Error: {e}. Waiting...", flush=True)
    
    time.sleep(5)

print("\n[TIMEOUT]", flush=True)
sys.exit(1)
