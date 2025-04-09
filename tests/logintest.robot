*** Settings ***
Library     Browser    auto_closing_level=KEEP
Library     Collections
Library     OperatingSystem
Library     dotenv    
Resource    Keywords.robot 
Library           Collections
Variables         load_env.py 
 

*** Test Cases ***
Test Login Flow
    New Browser    chromium    headless=No
    New Page       ${URL}

    Click    id=login-button

    Fill Text    id=login-username    ${username}
    Fill Text    id=login-password    ${password}
    Click    css=form#login-form button[type="submit"]

