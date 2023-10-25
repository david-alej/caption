const authorize = require("./authorize")
const captionsControllers = require("./captions")
const errorHandlers = require("./errorHandlers")
const loginControllers = require("./login")
const photosControllers = require("./photos")
const registerControllers = require("./register")
const userPhotosControllers = require("./userPhotos")
const usersControllers = require("./users")
const validators = require("./validators")

module.exports = {
  authorize,
  captionsControllers,
  errorHandlers,
  loginControllers,
  photosControllers,
  registerControllers,
  userPhotosControllers,
  usersControllers,
  validators,
}
