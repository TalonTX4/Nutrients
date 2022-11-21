// imports
const bcrypt = require("bcryptjs")

function auth(request, response, mySql){
    let rendArray = ["",""]
    const {username, email, password} = request.body
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, function(error, hash) {
            if (error) {
                console.log(error)
            }
            mySql.query('INSERT INTO users SET?', {name: username, email: email, password: hash}, (error) => {
                if (error) {
                    if(error.code === "ER_DUPE_ENTRY") {
                        rendArray = ["register","User already exists, try again"]
                        return rendArray
                    } else {
                        console.log(error)
                    }
                } else {
                    rendArray = ["register","User registered!"]
                    return rendArray
                }
            })
        })
    })
}

function normal(request, response, mySql) {
    let rendArray = ["",""];
    rendArray[0] = "register"
    return rendArray
}

module.exports = {
    normal,
    auth
}