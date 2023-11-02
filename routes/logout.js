const express = require("express")
const logoutRouter = express.Router()
const { logoutControllers } = require("../controllers/index")

logoutRouter.get("/", logoutControllers.getLogout)

logoutRouter.post("/", logoutControllers.postLogout)

module.exports = logoutRouter
