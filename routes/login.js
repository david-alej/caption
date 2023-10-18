const express = require("express")
const loginRouter = express.Router()
const { loginControllers } = require("../controllers/index")

loginRouter.get("/", loginControllers.getLogin)

loginRouter.post("/", loginControllers.postLogin)

module.exports = loginRouter
