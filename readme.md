to make code go brrr here are the steps
1. import node packages
2. set environment variables
   1. a template `.env` file can be found in `./templates/.env.template` the variables are as follows
      1. session secret should be generated at random
      2. DBPassword, DBUser, and DBHost are all for connection to a mysql database
      3. host port is the port the server should path through
   2. remove .template extension
   3. move to project folder
3. start by running `npm start` from the command line inside the project folder 

to add new pages (note replace `{Name}` with desired internal page name) 
1. make `{View}.hbs` in views folder
2. create `./src/routes/{Name}.js`
   1. functions should be structured with `(request, response, mySql)` as input variables
   2. use `module.exports` for each function
   3. all functions should `return rendArray["{View}","{Message}"]`
3. configure `./src/router.js` 
   1. should be set up import at top and export below
   2. import as `const {Route} = require("./routes/{Name}")`
4. add to `./src/app.js`
   1. structure as show below
   2. ```app.{restMethod}("{HTMLpath}", (req, res) => {
         let response = responseRouter.{Name}.{Function}(req, res, db)
         renderPage(res,response)
         })
5. start by running `npm start` from the command line inside the project folder 