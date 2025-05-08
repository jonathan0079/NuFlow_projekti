*** Settings ***
Library     Browser    auto_closing_level=KEEP
Library    CryptoLibrary
Resource    keywords.robot  

*** Test Cases ***
Test Login Flow
    New Browser    chromium    headless=No  
    New Page       ${URL}
    Sleep    2s
    Click    id=login-button

    Type Text    id=login-username    ${username}    delay=30ms
    Type Text    id=login-password    ${password}    delay=30ms
    Click    css=form#login-form button[class="form-button"]
    Wait For Elements State    id=logoutButton    visible    timeout=10s

Test Initial Info Flow
    Wait For Elements State    id=infoForm    visible    timeout=5s
    Type Text    textarea[name="drug_use"]    ${drug_use}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="diseases_medications"]    ${diseases_medications}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="sleep"]    ${sleep}    delay=30ms
    Sleep    0.1s
    Type Text    textarea[name="self_assessment"]    ${self_assesment}    delay=30ms
    Sleep    0.1s
    Click    id=submit-button
    Wait For Elements State    id=logoutButton    visible    timeout=10s
    Sleep    1s



Test Diary Entry + Graphview Flow
    Sleep    0.5s
    Click    id=openDiaryBtn
    Sleep    0.5s
    Click    css=label:has(input[value="evening"])
    Sleep    0.5s
    Evaluate JavaScript    css=#sleepRange    (elem) => { elem.value = 5; elem.dispatchEvent(new Event('input', { bubbles: true })); }
    Sleep    0.5s
    Type Text    css=textarea[placeholder="Lisätietoa..."]    ${sleep_detail}    delay=30ms
    Sleep    0.5s
    Evaluate JavaScript    css=#moodRange    (elem) => { elem.value = 4; elem.dispatchEvent(new Event('input', { bubbles: true })); elem.dispatchEvent(new Event('change', { bubbles: true })); }
    Sleep    0.5s
    Type Text    css=textarea[placeholder="Tähän voit kirjoittaa muita muistiinpanoja: "]   ${more_detail}    delay=30ms
    Sleep    0.5s
    Click    id=submit-button
    Sleep    5s
    Click    id=btn7days
    Sleep    3s
    Click    id=btn30days
    Sleep    3s
    Click    id=closing-button
    Sleep    3s
    Close Browser