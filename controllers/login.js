const bcrypt = require("bcrypt")
const { validationResult } = require("express-validator")
const models = require("../database/models")
const { Api404Error, Api400Error } = require("../util/index").apiErrors
const { generateToken } = require("../util/index").doubleCsrf

exports.getLogin = async (req, res) => {
  // res.render("login")
  res.status(200).send()
}

exports.postLogin = async (req, res, next) => {
  const { username, password } = req.body
  const validationErrors = validationResult(req.body).array()
  try {
    if (validationErrors.length >= 1) {
      throw new Api400Error(validationErrors[0].msg)
    }
    const user = await models.User.findOne({
      where: {
        username,
      },
    })
    if (user === null) {
      throw new Api404Error(`User with username: ${username} not found.`)
    }
    const passwordsMatch = await bcrypt.compare(
      password,
      user.dataValues.password
    )
    if (passwordsMatch) {
      req.session.authenticated = true
      delete user.dataValues.password
      req.session.user = user.dataValues

      const csrfToken = generateToken(req, res)

      res.status(200).json({
        message: `User with username: ${username} is now logged in.`,
        csrfToken,
      })
      return
    }
    throw new Api404Error(
      `User with username: ${username} input an incorrect password.`
    )
  } catch (err) {
    next(err)
  }
}
