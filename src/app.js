// imports
const express = require('express');
const mysql = require("mysql")
const bcrypt = require("bcryptjs")
const sessions = require("express-session")
const path = require("path")


// only use .env if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//definitions
let session;
// TODO improve robustness of isLoggedIn
let isLoggedIn = false;
const port = process.env.HOSTPORT;
const app = express();
const oneDay = 1000 * 60 * 60 * 24;
const publicDir = path.join(__dirname, './public')


// other imports



// app configuration
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())
app.use(express.static(publicDir))
app.use(sessions({
    secret: process.env.SESSIONSECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}))


// initialize database
const db = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: "Nutrients"
})


// connect to database
db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})


// function for page rendering to dry code
function renderPage(responseBody, path, message) {
    let id = -1
    let name = "Error Name not found"
    let pageMessage = ""
    if (isLoggedIn === true) {
        id = session.id
        name = session.username
    }

    if (message !== null) {
        pageMessage = message
    }

    return responseBody.render(path, {
        message: pageMessage,
        loggedIn: isLoggedIn,
        name: name,
        id: id
    })
}


app.set('view engine', 'hbs')

app.get("/", (req, res) => {
    renderPage(res, "login")
})

app.get("/register", (req, res) => {
    renderPage(res, "register")
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
                        renderPage(res, "register", "User already exists, try again")
                    } else {
                        console.log(error)
                    }
                } else {
                    renderPage(res, "register", "User registered!")
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
                    renderPage(res, "login", "Invalid username or password")
                }
            });
        } else {
            renderPage(res, "login", "Invalid username or password")
        }

    })

})

app.get("/account", (req,res) => {
    if (isLoggedIn === false) {
        res.redirect("/",)
    } else {
        res.render("account page", {

        })
    }
})

app.get('/logout',(req,res) => {
    req.session.destroy();
    isLoggedIn = false;
    res.redirect('/');
});

app.get("/login", (req, res) => {
    renderPage(res, "login")
})


// initialize app on port from environment
app.listen(port, ()=> {
    console.log("server started on port: " + port)
});