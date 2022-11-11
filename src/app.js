// imports
const express = require('express');
const mysql = require("mysql")
const bcrypt = require("bcryptjs")
const sessions = require("express-session")

const app = express();

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

// other imports
const path = require("path")

const publicDir = path.join(__dirname, './public')

app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())
app.use(express.static(publicDir))

app.use(sessions({
    secret: "thisIsMySecretKey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}))

const db = mysql.createConnection({
    host: "localhost",
    user: "Joseph",
    password: "987521741859875275391",
    database: "Nutrients"
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

app.set('view engine', 'hbs')

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/auth/register", (req, res) => {
    const { username, email, password } = req.body

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error) => {
        if(error){
            console.log(error)
        }
        // fixme no check to prevent email reuse

        // fixme no password confirmation
        let hashedPassword = await bcrypt.hash(password, 8)

        console.log(hashedPassword)

        db.query('INSERT INTO users SET?', {name: username, email: email, password: hashedPassword}, (error) => {
            if(error) {
                console.log(error)
            } else {
                return res.render('register', {
                    message: 'User registered!'
                })
            }
        })
    })
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
});