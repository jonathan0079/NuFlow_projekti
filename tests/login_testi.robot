*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    keywords.robot  

*** Test Cases ***
Test Login Flow
    New Browser    chromium    headless=No  
    New Page       ${URL}

    Click    id=login-button

    Fill Text    id=login-username    ${username}   
    Fill Text    id=login-password    ${password}  
    Click    css=form#login-form button[type="submit"]