const express = require("express")
const userPhotosRouter = express.Router()
const { userPhotosControllers } = require("../controllers/index")
const { usernameValidator } = require("../controllers/index").validators

userPhotosRouter.param(
  "username",
  usernameValidator("username", true),
  userPhotosControllers.paramUsername
)

userPhotosRouter.get("/:username", userPhotosControllers.getuserPhotos)

userPhotosRouter.delete("/:username", userPhotosControllers.deleteuserPhotos)

module.exports = userPhotosRouter
