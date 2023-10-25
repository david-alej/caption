const express = require("express")
const usersRouter = express.Router()
const { usersControllers } = require("../controllers/index")
const { usernameValidator, credentialsValidator, newCredentialsValidator } =
  require("../controllers/index").validators

usersRouter.param(
  "username",
  usernameValidator("username", true, false),
  usersControllers.paramUsername
)

usersRouter.get("/", usersControllers.getUsers)

usersRouter.get("/:username", usersControllers.getUser)

usersRouter.put(
  "/",
  [...credentialsValidator, ...newCredentialsValidator],
  usersControllers.putUser
)

usersRouter.delete(
  "/:username",
  credentialsValidator,
  usersControllers.deleteUser
)

module.exports = usersRouter
