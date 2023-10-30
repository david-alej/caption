const express = require("express")
const registerRouter = express.Router()
const { registerControllers } = require("../controllers/index")
const { credentialsValidator, usernameValidator } =
  require("../controllers/index").validators

registerRouter.get("/", registerControllers.getRegister)

registerRouter.post(
  "/",
  credentialsValidator(),
  registerControllers.postRegister
)

module.exports = registerRouter
