const express = require("express")
const { check } = require("express-validator")
const loginRouter = express.Router()
const { loginControllers } = require("../controllers/index")
const { credentialsValidator } = require("../controllers/index").validators

loginRouter.get("/", loginControllers.getLogin)

loginRouter.post("/", credentialsValidator, loginControllers.postLogin)

module.exports = loginRouter
