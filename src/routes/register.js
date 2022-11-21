// imports
const bcrypt = require("bcryptjs")

function auth(request, response, mySql){
    let rendArray = ["register",""]
    const {username, email, password} = request.body
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, function(error, hash) {
            if (error) {
                console.log(error)
            }
            mySql.query('INSERT INTO users SET?', {name: username, email: email, password: hash}, (error) => {
                if (error) {
                    if(error.code === "ER_DUPE_ENTRY") {
                        rendArray[1] = "User already exists, try again"
                        return rendArray
                    } else {
                        console.log(error)
                    }
                } else {
                    rendArray[1] = "User registered!"
                    return rendArray
                }
            })
        })
    })
}

function normal(request, response, mySql) {
    let rendArray = ["register",""];
    return rendArray
}

module.exports = {
    normal,
    auth
}