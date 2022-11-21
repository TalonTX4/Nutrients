// imports
const express = require("express");
const mysql = require("mysql")
const sessions = require("express-session")
const path = require("path")


// only use .env if not in production
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

//definitions
let session;
// TODO improve robustness of isLoggedIn
let isLoggedIn = false;
const port = process.env.HOSTPORT;
const app = express();
const oneDay = 1000 * 60 * 60 * 24;
const publicDir = path.join(__dirname, "./public")


// internal imports
const responseRouter = require("./router");


// app configuration
app.use(express.urlencoded({extended: "false"}))
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
function renderPage(res, input) {
    let id = -1
    let name = "Error Name not found"
    let pageMessage = input[1]
    if (isLoggedIn === true) {
        id = session.id
        name = session.username
    }
    return res.render(input[0], {
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
    let response = responseRouter.register.normal(req, res, db)
    renderPage(res,response)
})

app.post("/auth/register", async (req, res) => {
    let response = responseRouter.register.auth(req, res, db)
    renderPage(res,response)
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