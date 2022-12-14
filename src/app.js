// imports
const express = require('express');
const mysql = require("mysql")
const bcrypt = require("bcryptjs")
const sessions = require("express-session")

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
let session;

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
    secret: process.env.SESSIONSECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}))

const db = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: "Nutrients"
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

// TODO improve robustness of isLoggedIn
let isLoggedIn;

app.set('view engine', 'hbs')

app.get("/", (req, res) => {
    res.render("index", {
        loggedIn: isLoggedIn
    })
})

app.post("/auth/register", async (req, res) => {
    const {username, email, password} = req.body

    // fixme no password confirmation
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, function(error, hash) {
            if (error) {
                console.log(error)
            }
            db.query('INSERT INTO users SET?', {name: username, email: email, password: hash}, (error) => {
                if (error) {
                    if(error.code === "ER_DUPE_ENTRY") {
                        return res.render('register', {
                            message: 'User already exists, try again',
                            loggedIn: isLoggedIn
                        })
                    } else {
                        console.log(error)
                    }
                } else {
                    return res.render('register', {
                        message: 'User registered!',
                        loggedIn: isLoggedIn
                    })
                }
            })
        });
    })


})

app.post("/auth/login", (req, res ) => {
    const {username, password} = req.body
    db.query('SELECT password FROM users WHERE name = ?', [username], (error, result) => {
        if (error) {
            console.log(error)
        }
        if (result.length >= 1) {
            let dbPassObj = JSON.parse(JSON.stringify(result[0]));
            let hash = dbPassObj.password

            bcrypt.compare(password, hash, function(err, result) {
                if (result) {
                    session = req.session;
                    session.username = req.body.username;
                    session.loggedin = true;
                    db.query('SELECT id FROM users WHERE name = ?', [username], (error, result) => {
                        let dbIDObj = JSON.parse(JSON.stringify(result[0]));
                        session.userid = dbIDObj.id
                        console.log(req.session)
                    })
                    isLoggedIn = true
                    return res.redirect("/")
                } else {
                    return res.render('login', {
                        message: 'Invalid username or password',
                        loggedIn: isLoggedIn
                    })
                }
            });
        } else {
            return res.render('login', {
                message: 'Invalid username or password',
                loggedIn: isLoggedIn
            })
        }

    })

})

app.get("/account", (req,res) => {
    if (isLoggedIn === false) {
        res.redirect("/",)
    } else {
        res.render("account page", {
            name: session.username
        })
    }
})

app.get('/logout',(req,res) => {
    req.session.destroy();
    isLoggedIn = false;
    res.redirect('/');
});

app.get("/register", (req, res) => {
    res.render("register", {
        loggedIn: isLoggedIn
    })
})

app.get("/login", (req, res) => {
    res.render("login", {
        loggedIn: isLoggedIn
    })
})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
});