import urllib.request
import time
import sys

url = "https://rubengp02.github.io/BotOS/js/state.js"
max_retries = 60 # 5 minutes max

print("Polling GitHub Pages for the state.js update...", flush=True)
for i in range(max_retries):
    try:
        req = urllib.request.Request(url, headers={'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                js_content = response.read().decode('utf-8')
                if "2500" in js_content and "1.65" in js_content:
                    print("\n[SUCCESS] Update is live!", flush=True)
                    sys.exit(0)
                else:
                    print(f"[{i}] Site is serving old cache. Waiting...", flush=True)
    except Exception as e:
        print(f"[{i}] Error: {e}. Waiting...", flush=True)
    
    time.sleep(5)

print("\n[TIMEOUT]", flush=True)
sys.exit(1)
