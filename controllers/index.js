const authorize = require("./authorize")
const captionsControllers = require("./captions")
const errorHandlers = require("./errorHandlers")
const loginControllers = require("./login")
const logoutControllers = require("./logout")
const photosControllers = require("./photos")
const rateLimiters = require("./rateLimiters")
const registerControllers = require("./register")
const usersControllers = require("./users")
const validators = require("./validators")

module.exports = {
  authorize,
  captionsControllers,
  errorHandlers,
  loginControllers,
  logoutControllers,
  photosControllers,
  rateLimiters,
  registerControllers,
  usersControllers,
  validators,
}
