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
    Wait For Elements State    id=logoutButton    visible

Test Initial Info Flow
    Wait For Elements State    id=infoForm    visible    timeout=10s
    Type Text    textarea[name="drug_use"]    ${drug_use}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="diseases_medications"]    ${diseases_medications}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="sleep"]    ${sleep}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="self_assessment"]    ${self_assesment}    delay=30ms
    Sleep    0.1s
    Click    id=submit-button
    Wait For Elements State    id=month-year    visible    timeout=10s
    Sleep    1s

Test Info Edit Flow
    Wait For Elements State    text=Omat tiedot    visible    timeout=10s
    Sleep    0.5s
    Click    text=Omat tiedot
    Sleep    1s
    Type Text    input[name="first_name"]    ${first_name}    delay=30ms
    Sleep    0.1s
    Type Text    input[name="last_name"]    ${last_name}    delay=30ms
    Sleep    0.1s
    Type Text    input[name="height"]    ${height}    delay=30ms
    Sleep    0.1s
    Type Text    input[name="weight"]    ${weight}    delay=30ms
    Sleep    0.1s
    Type Text    input[name="gender"]    ${gender}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="drug_use"]    ${drug_use}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="diseases_medications"]    ${diseases_medications}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="sleep"]    ${sleep}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="self_assessment"]    ${self_assesment}    delay=30ms
    Sleep    0.1s
    Click    id=submit-button

Test User Delete Flow
    Sleep    1s
    Click    css=.settings-link
    Sleep    0.5s
    Type Text    input[type="email"]    ${username}    delay=30ms
    Sleep    0.5s
    Click    button[id="delete-account"]
    Sleep    0.5s
    Click    button[id="confirm-delete"]
    Wait For Elements State    id=login-button    visible    timeout=10s
    Close Browser


