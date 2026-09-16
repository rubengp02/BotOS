import urllib.request
import time
import sys

url = "https://rubengp02.github.io/BotOS/index.html"
max_retries = 60 # 5 minutes max (60 * 5 = 300s)

print("Starting to poll GitHub Pages...")
for i in range(max_retries):
    try:
        req = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                html = response.read().decode('utf-8')
                if "Datos Sintéticos" in html:
                    print("\n[SUCCESS] Site is live and updated!")
                    sys.exit(0)
                else:
                    print(f"[{i}] Site is up but serving old cache. Waiting...")
    except urllib.error.HTTPError as e:
        print(f"[{i}] HTTP Error {e.code}. Waiting...")
    except Exception as e:
        print(f"[{i}] Error: {e}. Waiting...")
    
    time.sleep(5)

print("\n[TIMEOUT] Could not verify deployment after 5 minutes.")
sys.exit(1)
