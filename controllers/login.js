const bcrypt = require("bcrypt")
const { validationResult, matchedData } = require("express-validator")
const models = require("../database/models")
const { Api404Error, Api400Error, Api500Error } =
  require("../util/index").apiErrors
const { generateToken } = require("../util/index").doubleCsrf
const { authenticate } = require("../util/index").authenticate

exports.getLogin = async (req, res) => {
  // res.render("login")
  res.status(200).send()
}

exports.postLogin = async (req, res, next) => {
  const validationErrors = validationResult(req).array({
    onlyFirstError: true,
  })[0]
  try {
    if (validationError) {
      if (validationError.msg.substr(0, 17) === "Programming error") {
        throw new Api500Error(validationError.msg)
      }
      throw new Api400Error(validationError.msg)
    }

    const { username, password } = matchedData(req)

    await authenticate(username, password)

    req.session.authenticated = true
    delete user.dataValues.password
    req.session.user = user.dataValues

    const csrfToken = generateToken(req, res)

    res.status(200).json({
      message: `User with username: ${username} is now logged in.`,
      csrfToken,
    })
  } catch (err) {
    next(err)
  }
}
