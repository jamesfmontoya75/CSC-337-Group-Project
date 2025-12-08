const express = require("express")
const app = express()
const url = require("url")
const fs = require("fs")
const querystring = require("querystring")
const bodyParser = require("body-parser")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))




app.get("/login", (req, res)=>{
    var htmlcontent = ''
    try{
        htmlcontent = fs.readFileSync('login.html', {'encoding' : 'utf8'})
    }catch(err){
        console.log(err)
    }
    res.end(htmlcontent)
})

app.post("/action", (req, res)=>{
    var userInfo = {
        username: req.body.username,
        password: req.body.password
    }
    var temp = ""
    for(var i = 1; i < userInfo.password.length-1; i++){
        temp += "*"
    }
    console.log(temp)
    res.end(`<!DOCTYPE html>
<html>
    
    <style>
        body{
            margin: 0px;
        }
        h1{
            font-size: 75px;
            background-color: lightcoral;
            text-align: center;
        }
        h4{
            font-size: 30px;
            text-align: center;
        }
        p{
            font-size: 30px;
            text-align: center;
        }
    </style>
    <body>
        <title>Login</title>
        <h1>Welcome to Mockbuster!</h1>
        <br>
        <h4>Your Info Has Been Entered</h4>
        <h4>Entered Data:</h4>
        <p>Username: ${userInfo.username}</p>
        <p>Password: ${userInfo.password[0] + temp + userInfo.password[userInfo.password.length-1]}</p>
        <form action="home">
            <input type="submit" value="continue">
        </form>
    </body>
</html>`)
})

app.get("/home", (req, res)=>{
    var htmlcontent = ''
    try{
        htmlcontent = fs.readFileSync('index.html', {'encoding' : 'utf8'})
    }catch(err){
        console.log(err)
    }
    res.end(htmlcontent)
})

app.get("/about", (req, res)=>{
    var htmlcontent = ''
    try{
        htmlcontent = fs.readFileSync('about.html', {'encoding' : 'utf8'})
    }catch(err){
        console.log(err)
    }
    res.end(htmlcontent)
})

app.listen(8080, function(){
    console.log("Server Running")
})