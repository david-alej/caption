const express = require("express")
const logoutRouter = express.Router()
const { logoutControllers } = require("../controllers/index")
const { credentialsValidator } = require("../controllers/index").validators

logoutRouter.get("/", logoutControllers.getLogout)

logoutRouter.post("/", credentialsValidator(), logoutControllers.postLogout)

module.exports = logoutRouter
