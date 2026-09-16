import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')

try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get('http://localhost:8080/index.html')
    time.sleep(2)
    
    driver.execute_script('switchTab("bots")')
    time.sleep(1)
    
    html = driver.execute_script('return document.getElementById("sidebarApprovedCount").innerText')
    print("COUNT TEXT:", html)
    
    live_approved = driver.execute_script('return window.candidatesData.filter(b => b.isApproved).map(b => b.id)')
    print("Bots with isApproved:", live_approved)
    
    driver.quit()
except Exception as e:
    print("Error:", e)
