const express = require("express")
const usersRouter = express.Router()
const { usersControllers } = require("../controllers/index")
const {
  credentialsValidator,
  usernameValidator,
} = require("../controllers/validators")

usersRouter.param("username", usernameValidator, usersControllers.paramUser)

usersRouter.get("/", usersControllers.getUsers)

usersRouter.get("/:username", usersControllers.getUser)

usersRouter.put("/", credentialsValidator, usersControllers.putUser)

usersRouter.delete("/all", credentialsValidator, usersControllers.deleteUsers)

usersRouter.delete("/self", credentialsValidator, usersControllers.deleteSelf)

usersRouter.delete(
  "/:username",
  credentialsValidator,
  usersControllers.deleteUser
)

module.exports = usersRouter