const express = require("express")
const loginRouter = express.Router()
const loginController = require("../controllers/login")

loginRouter.get("/", loginController.getLogin)

loginRouter.post("/", loginController.postLogin)

module.exports = loginRouter
