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
    let response = responseRouter.register.normal()
    renderPage(res,response)
})

app.post("/auth/register", (req, res) => {
    let response = responseRouter.register.auth(req, res, db)
    renderPage(res,response)
})

app.get("/login", (req, res) => {
    let response = responseRouter.login.normal()
    renderPage(res,response)
})

app.post("/auth/login", (req, res ) => {
    let response = responseRouter.login.auth(req, res, db, session)
    if(response[2] == true){
        isLoggedIn = true
        return res.redirect("/")
    } else {
        renderPage(res,response)
    }
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




// initialize app on port from environment
app.listen(port, ()=> {
    console.log("server started on port: " + port)
});