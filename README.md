# NuFlow_projekti

## GIT-Käyttöohje ryhmälle
Kaikki ryhmäläiset seuraavat tätä sääntöä jotta ei tulisi ongelmia GIT:n puolelta.

- Jokaisella ryhmäläisellä on oma branch ("oma nimi"_v2) näitä saa päivittää oman mielesi mukaan.
  
- TEST-branch on meidän pää kehityshaara johon tehdään meidän koodi. main-branch päivitetään ainoastaan silloin kun koodin uudet ominaisuudet ovat täysin toiminnallisia

- Nyrkkisääntönä on se, että määritellään kukin jäsen on vastuussa mistä osan koodista, jotta koodien yhdistämisessä ei tulisi ongelmia

### 1. Mitä tehdä ihan ensimmäisenä kun avaa VS-code

Ensimmäisenä on vetää kaikki uusimmat muutokset remote TEST-branchistä itsellesi omaan local branch

```bash
git pull origin TEST
```
Komento vetää ja päivittää TEST-branchin. Tämä on hyvä tehdä aina vaikka ei olisikaan muutoksia, jotta ei tule tilannetta jossa yrität päivittää oman koodin pohjan TEST-branchillä joka on jo valmiiksi vanha versio.

### 2. Koodin päivittäminen omaan branchiin
Jokaisen ryhmäläisen tulee päivittää niiden oma branch TEST-branchillä mikäli uusia päivityksiä löytyy. Tällä tavoin kaikki pysyvät ajan tasalla ja koodaavat niinsanotusti: "samaa pohjaa" aina.
ohessa askel kerrallaan miten tämä tehdään:

```bash
git fetch origin TEST
```
tämä komento hakee uusimmat remote branch muutokset repositoriossa ilman muutoksia omaan koodiin.

```bash
git checkout "oma-branch"_v2
```
tämä aktivoi sinun nykyisen oma branchin käyttöön jos se ei ole jo valmiiksi.

```bash
git merge origin/TEST
```
tämä yhdistää aikaisemmin haetun TEST-branchin koodin oman branchin koodiin kun aikaisemmat askeleet ovat suoritettu. 

### 3. oman koodin päivittäminen TEST:in
Kun omassa branchissä on valmis uusi ominaisuus, ryhmäläinen tulee kommunikoida viesti muille, niin että kaikki ryhmäläiset näkevät ja vastaavat tavalla tai toisella viestiin ennen kuin päivittää TEST-branchin

![image](https://github.com/user-attachments/assets/1c92dde1-0cea-43aa-9945-f07975be2a6b)

ohessa esimerkki jossa on peukalo-emoji myönteisenä vastauksena.

![image](https://github.com/user-attachments/assets/2316501a-ae76-457e-83c4-680b4349d4b9)

Kun saatu vastaus kaikilta ryhmäläisiltä ja olet päivittänyt TEST-branchin niin tulee laittaa viesti että päivitys on hoidettu. ällöin kaikki voi vetää päivitetyn TEST-branchin itselleen. 

Oman koodin lisääminen TEST:in toimii näin askel kerrallaan:

```bash
git checkout TEST
```
Aktivoi TEST-branchin

```bash
git merge "oma-branch"_v2
```
Tämä yhdistää oman branchin muutokset aikaisemmin aktivoituun branchiin

```bash
git add .
```
Tämä lisää kaikki uudet tiedostot, mikäli niitä on uusia.

```bash
git commit -m"uusi päivitys"
```
Tallentaa muutokset paikalliseen Git-repositorioon. Se luo uuden commitin, joka sisältää kaikki muutokset mitä `git add .` teki.

```bash
git push origin TEST
```
Tämä päivittää kaikki muutokset ja puskee sen githubin TEST branchiin.
