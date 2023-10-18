const express = require("express")
const registerRouter = express.Router()
const { registerControllers } = require("../controllers/index")
const { registerValidator } = require("../controllers/index").validators

registerRouter.get("/", registerControllers.getRegister)

registerRouter.post("/", registerValidator, registerControllers.postRegister)

module.exports = registerRouter
