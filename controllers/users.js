const { matchedData, validationResult } = require("express-validator")
const models = require("../database/models")
const { Api400Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramUser = async (req, res, next, username) => {
  const validationError = validationResult(req.body).array({
    onlyFirstError: true,
  })[0]
  try {
    if (validationError) {
      if (validationError.msg.substr(0, 17) === "Programming error") {
        throw new Api500Error(validationError.msg, (isOperational = false))
      }
      throw new Api400Error(validationError.msg)
    }
    req.user = JSON.parse(matchedData(req).username)
    next()
  } catch (err) {
    next(err)
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const users = await models.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
}

exports.getUser = async (req, res, next) => {
  const user = req.user
  try {
    req.send(user)
  } catch (err) {
    next(err)
  }
}

exports.putUser = async (req, res, next) => {
  const user = req.user
  const validationError = validationResult(req).array({
    onlyFirstError: true,
  })[0]
  try {
    if (validationError) {
      if (validationError.msg.substr(0, 17) === "Programming error") {
        throw new Api500Error(validationError.msg, (isOperational = false))
      }
      throw new Api400Error(validationError.msg)
    }

    const { username, password, newUsername, newPassword } = matchedData(req)

    // check at least one new value is inserted
    if (!newUsername && !newPassword) {
      throw new Api400Error(
        `User with username: ${username} did not update any values.`
      )
    }

    // check username exists
    const user = await models.User.findOne({
      where: {
        username,
      },
    })
    if (!user) {
      throw new Api404Error(`User with username: ${username} not found.`)
    }

    // check password is correct
    const passwordsMatch = await bcrypt.compare(
      password,
      user.dataValues.password
    )
    if (!passwordsMatch) {
      throw new Api404Error(
        `User with username: ${username} input an incorrect password.`
      )
    }

    // fill in new values to object
    let updatedValues = { username, password }
    if (newUsername) {
      updatedValues.username = newUsername
    }

    if (newPassword) {
      updatedValues.password = newPassword
    }

    const updated = await models.User.update(updatedValues, {
      where: { id: user.id },
    })

    if (!updated) {
      throw new Api500Error(
        `user with username: ${username} update query did not work.`
      )
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteUsers = async (req, res, next) => {}

exports.deleteUser = async (req, res, next) => {}
