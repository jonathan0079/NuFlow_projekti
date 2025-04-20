*** Keywords ***
Login With Valid Credentials

${URL}          http://localhost:5500/
${username}     elsikubios@gmail.com
${password}     750GmuduMdLX
 Click        css=form#login-form button[type="submit"]