// imports
const bcrypt = require("bcryptjs")

function auth(request, response, mySql, session){
    let rendArray = ["login","",false]
    const {username, password} = request.body
    mySql.query('SELECT password FROM users WHERE name = ?', [username], (error, result) => {
        if (error) {
            console.log(error)
        }
        if (result.length >= 1) {
            let dbPassObj = JSON.parse(JSON.stringify(result[0]));
            let hash = dbPassObj.password

            bcrypt.compare(password, hash, function(err, result) {
                if (result) {
                    rendArray[2] = true
                    session = request.session;
                    session.username = request.body.username;
                    session.loggedin = true;
                    mySql.query('SELECT id FROM users WHERE name = ?', [username], (error, result) => {
                        let dbIDObj = JSON.parse(JSON.stringify(result[0]));
                        session.userid = dbIDObj.id
                        console.log(request.session)
                    })
                } else {
                    rendArray[1] = "Invalid username or password"
                }
            });
        } else {
            rendArray[1] = "Invalid username or password"
        }
        return rendArray
    })
}

function normal() {
    let rendArray = ["login",""];
    return rendArray
}

module.exports = {
    normal,
    auth
}
