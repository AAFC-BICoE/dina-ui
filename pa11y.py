import time
import os
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager

website = 'https://dina.local/auth/realms/dina/protocol/openid-connect/auth?client_id=dina-public&redirect_uri=https%3A%2F%2Fdina.local%2F&state=295423e5-c8ae-428a-849b-7088174c0af3&response_mode=fragment&response_type=code&scope=openid&nonce=6877b9a9-3f03-496b-8163-cbb121470c71'

driver = webdriver.Chrome(ChromeDriverManager().install())




driver.get(website)




links = set()
traversed = set()
link_exclude = set()
traverse_exclude = set()


def logon():
    usernameField = driver.find_element_by_id("username")
    passwordField = driver.find_element_by_id("password")
    loginButton = driver.find_element_by_id("kc-login")

    usernameField.send_keys("dina-admin")
    passwordField.send_keys("dina-admin")
    loginButton.click()

def traverse(page):
    driver.get(page)
    links.add(page)
    traversed.add(page)
    time.sleep(1)
    local_links = driver.find_elements_by_tag_name("a")
    urls = []

    for url in local_links:
         urls.append(str(url.get_attribute('href')))

    for url in urls:
            if url not in links and 'dina.local' in url and '#' not in url and 'wbdisable' not in url:
                if '?' not in url:
                    links.add(url)
                else:
                    short_url = url.split('?')[0]
                    if short_url not in link_exclude:
                        links.add(url)
                        link_exclude.add(short_url)
            if url not in traversed and 'dina.local' in url and '#' not in url and 'wbdisable' not in url:
                if '?' not in url:
                    traverse(url)
                else:
                    short_url = url.split('?')[0]
                    if short_url not in traverse_exclude:
                        traverse_exclude.add(short_url)
                        traverse(url)




def replace_line(filename,line_number,output):
    f=open(filename, 'r')
    lines = f.readlines()
    lines[line_number - 1] = output
    f.close()

    f=open(filename, 'w')
    f.writelines(lines)
    f.close()


def runPa11y():
    print("Generating Reports...")
    os.system("pa11y-ci")
    print("Complete!")
    driver.quit()  


choice = "y"
#choice = input("Scrape website? (y/n)")
choice = choice.strip().lower()
print("This will take a while.")
if (choice == "n"):
     runPa11y()    
else:          
    print("Scraping Website...")
    logon()
    traverse('https://dina.local')
    output = ""
    for link in links:
     output += "," + '"' + link + '"'
    replace_line(".pa11yci", 22, output)
    runPa11y()
import os
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager

website = 'https://dina.local/auth/realms/dina/protocol/openid-connect/auth?client_id=dina-public&redirect_uri=https%3A%2F%2Fdina.local%2F&state=295423e5-c8ae-428a-849b-7088174c0af3&response_mode=fragment&response_type=code&scope=openid&nonce=6877b9a9-3f03-496b-8163-cbb121470c71'

driver = webdriver.Chrome(ChromeDriverManager().install())




driver.get(website)




links = set()
traversed = set()
link_exclude = set()
traverse_exclude = set()


def logon():
    usernameField = driver.find_element_by_id("username")
    passwordField = driver.find_element_by_id("password")
    loginButton = driver.find_element_by_id("kc-login")

    usernameField.send_keys("dina-admin")
    passwordField.send_keys("dina-admin")
    loginButton.click()

def traverse(page):
    driver.get(page)
    links.add(page)
    traversed.add(page)
    time.sleep(1)
    local_links = driver.find_elements_by_tag_name("a")
    urls = []

    for url in local_links:
         urls.append(str(url.get_attribute('href')))

    for url in urls:
            if url not in links and 'dina.local' in url and '#' not in url and 'wbdisable' not in url:
                if '?' not in url:
                    links.add(url)
                else:
                    short_url = url.split('?')[0]
                    if short_url not in link_exclude:
                        links.add(url)
                        link_exclude.add(short_url)
            if url not in traversed and 'dina.local' in url and '#' not in url and 'wbdisable' not in url:
                if '?' not in url:
                    traverse(url)
                else:
                    short_url = url.split('?')[0]
                    if short_url not in traverse_exclude:
                        traverse_exclude.add(short_url)
                        traverse(url)




def replace_line(filename,line_number,output):
    f=open(filename, 'r')
    lines = f.readlines()
    lines[line_number - 1] = output
    f.close()

    f=open(filename, 'w')
    f.writelines(lines)
    f.close()


def runPa11y():
    print("Generating Reports...")
    os.system("pa11y-ci")
    print("Complete!")
    driver.quit()  


choice = "y"
#choice = input("Scrape website? (y/n)")
choice = choice.strip().lower()
print("This will take a while.")
if (choice == "n"):
     runPa11y()    
else:          
    print("Scraping Website...")
    logon()
    traverse('https://dina.local')
    output = ""
    for link in links:
     output += "," + '"' + link + '"'
    replace_line(".pa11yci", 22, output)
    runPa11y()
