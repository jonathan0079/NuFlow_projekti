*** Settings ***
Library     Browser    auto_closing_level=KEEP
Library    CryptoLibrary
Resource    keywords.robot  

*** Test Cases ***
Test Login Flow
    New Browser    chromium    headless=No  
    New Page       ${URL}

    Click    id=login-button

    Type Text    id=login-username    ${username}    delay=80ms
    Type Text    id=login-password    ${password}    delay=80ms
    Click    css=form#login-form button[class="form-button"]
    Wait For Elements State    id=myinfo-nav-link    visible

Test Logout Flow
    Wait For Elements State    id=logoutButton    visible    timeout=3s
    Sleep    2s
    Click    id=logoutButton
    Wait For Elements State    id=login-button    visible    timeout=3s
    Sleep    2s
    Close Browser