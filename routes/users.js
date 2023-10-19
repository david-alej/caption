const express = require("express")
const usersRouter = express.Router()
const { usersControllers } = require("../controllers/index")
const { usernameValidator } = require("../controllers/validators")

usersRouter.param("username", usernameValidator, usersControllers.paramUser)

usersRouter.get("/", usersControllers.getUsers)

usersRouter.get("/:username", usersControllers.getUser)

usersRouter.put("/:username", usersControllers.putUser)

usersRouter.delete("/", usersControllers.deleteUsers)

usersRouter.delete("/:username", usersControllers.deleteUser)

module.exports = usersRouter
