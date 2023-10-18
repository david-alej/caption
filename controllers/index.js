const authorize = require("./authorize")
const captionControllers = require("./caption")
const errorHandlers = require("./errorHandlers")
const loginControllers = require("./login")
const photoControllers = require("./photo")
const registerControllers = require("./register")
const userControllers = require("./user")
const validators = require("./validators")

module.exports = {
  authorize,
  captionControllers,
  errorHandlers,
  loginControllers,
  photoControllers,
  registerControllers,
  userControllers,
  validators,
}
