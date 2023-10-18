const express = require("express")
const userRouter = express.Router()
const { userControllers } = require("../controllers/index")

userRouter.post("/", userControllers.postUser)

userRouter.get("/", userControllers.getUsers)

userRouter.get("/", userControllers.getUser)

userRouter.put("/", userControllers.putUser)

userRouter.delete("/", userControllers.deleteUsers)

userRouter.delete("/", userControllers.deleteUser)

module.exports = userRouter
