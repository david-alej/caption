const express = require("express")
const { check } = require("express-validator")
const loginRouter = express.Router()
const { loginControllers } = require("../controllers/index")
const { loginValidator } = require("../controllers/index").validators

loginRouter.get("/", loginControllers.getLogin)

loginRouter.post("/", loginValidator, loginControllers.postLogin)

module.exports = loginRouter
