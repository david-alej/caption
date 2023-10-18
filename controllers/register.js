const { validationResult } = require("express-validator")
const models = require("../database/models")
const { Api404Error, Api400Error } = require("../util/index").apiErrors
const { passwordHash } = require("../util/index").passwordHash

exports.getRegister = async (req, res) => {
  // res.render("register")
  res.status(200).send()
}

exports.postRegister = async (req, res, next) => {
  const { username, password } = req.body
  const saltRounds = 10
  const validationErrors = validationResult(req.body).array()
  try {
    if (validationErrors.length >= 1) {
      throw new Api400Error(validationErrors[0].msg)
    }
    const hashedPassword = await passwordHash(password, saltRounds)
    const user = await models.User.create({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    res.status(201).json(`User with username: ${username} is created.`)
  } catch (err) {
    next(err)
  }
}
