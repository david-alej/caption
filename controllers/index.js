const authorize = require("./authorize")
const captionsControllers = require("./captions")
const errorHandlers = require("./errorHandlers")
const loginControllers = require("./login")
const logoutControllers = require("./logout")
const photosControllers = require("./photos")
const rateLimiter = require("./rateLimiter")
const registerControllers = require("./register")
const usersControllers = require("./users")
const validators = require("./validators")
const votesControllers = require("./votes")

module.exports = {
  authorize,
  captionsControllers,
  errorHandlers,
  loginControllers,
  logoutControllers,
  photosControllers,
  rateLimiter,
  registerControllers,
  usersControllers,
  validators,
  votesControllers,
}
