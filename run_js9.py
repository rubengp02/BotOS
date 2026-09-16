import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get('https://rubengp02.github.io/BotOS/index.html')
    time.sleep(3)
    
    # Check console logs immediately
    logs = driver.get_log('browser')
    print("CONSOLE LOGS BEFORE SWITCH:")
    for entry in logs:
        print(entry['level'], entry['message'])
        
    driver.execute_script('switchTab("candidates")')
    time.sleep(2)
    
    logs = driver.get_log('browser')
    print("CONSOLE LOGS AFTER SWITCH:")
    for entry in logs:
        print(entry['level'], entry['message'])
    
    cands_html = driver.execute_script('return document.getElementById("candidatesGrid").innerHTML')
    cands_text = driver.execute_script('return document.getElementById("candidatesGrid").innerText')
    print("DEMO-VAL-01 in Candidates HTML?", "DEMO-VAL-01" in cands_html)
    print("CANDIDATES TEXT DUMP:")
    print(cands_text.strip() if cands_text else "EMPTY")
    
    # Also evaluate why the JS logic might be failing
    eval_result = driver.execute_script('''
        const active = candidatesData.filter(c => {
            if (c.isApproved || c.isPaper || c.mode === "PAPER" || c.mode === "LIVE") return false;
            const ev = evaluate7Filters(c);
            if (!ev.isAdmissible) return false;
            const p = c.total_profit !== undefined ? c.total_profit : (c.profit !== undefined ? c.profit : (c.profitIS || 0));
            if (typeof p !== "number" || isNaN(p) || !isFinite(p) || p <= 0) return false;
            return true;
        });
        return active.length;
    ''')
    print("HOW MANY PASS JS FILTER?", eval_result)

    driver.quit()
except Exception as e:
    print("Error:", e)
