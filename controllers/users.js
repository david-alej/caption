const { matchedData, validationResult } = require("express-validator")
const models = require("../database/models")
const { authenticate } = require("../util/index").authenticate
const { Api400Error, Api401Error, Api404Error, Api500Error } =
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

    const { username } = matchedData(req)

    const user = await models.User.findOne({
      where: { username },
      include: models.Photo,
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    if (!user) {
      throw new Api404Error(`User with username: ${username} not found.`)
    }

    req.user = user.dataValues
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
    req.json(user)
  } catch (err) {
    next(err)
  }
}

exports.putUser = async (req, res, next) => {
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

    const user = await models.User.findOne({
      where: { username: newUsername },
    })

    if (user) {
      throw new Api400Error("New username is already in use.")
    }

    if (!newUsername && !newPassword) {
      throw new Api400Error(
        `User with username: ${req.session.user.username} did not update any values.`
      )
    }

    await authenticate(username, password)

    const updatedValues = { username, password }
    if (newUsername) {
      updatedValues.username = newUsername
    }

    if (newPassword) {
      updatedValues.password = newPassword
    }

    const updated = await models.User.update(updatedValues, {
      where: { id: req.session.user.id },
    })

    if (!updated) {
      throw new Api500Error(
        `user with username: ${username} update query did not work.`
      )
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

exports.deleteUsers = async (req, res, next) => {
  const validationError = validationResult(req).array({
    onlyFirstError: true,
  })[0]
  try {
    if (validationError) {
      if (validationError.msg.substr(0, 17) === "Programming error") {
        throw new Api500Error(validationError.msg)
      }
      throw new Api400Error(validationError.msg)
    }

    if (!req.session.user.isAdmin) {
      throw new Api401Error("User is not authorized to delete all users.")
    }

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      truncate: true,
    })
    if (!deleted) {
      throw new Api500Error(`Delete all query did not work.`)
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

exports.deleteSelf = async (req, res, next) => {
  const validationError = validationResult(req).array({
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

    const deleted = await models.User.destroy({
      where: {
        username,
      },
    })

    if (!deleted) {
      throw new Api500Error(`Delete user query did not work.`)
    }
  } catch (err) {
    next
  }
}

exports.delteUser = async (req, res, next) => {
  const targetUser = req.user
  const validationError = validationResult(req).array({
    onlyFirstError: true,
  })[0]
  try {
    if (validationError) {
      if (validationError.msg.substr(0, 17) === "Programming error") {
        throw new Api500Error(validationError.msg)
      }
      throw new Api400Error(validationError.msg)
    }

    if (!req.session.user.isAdmin) {
      throw new Api401Error("User is not authorized to delete a users.")
    }

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      where: {
        username: targetUser.username,
      },
    })

    if (!deleted) {
      throw new Api500Error(`Delete a user query did not work.`)
    }
  } catch (err) {
    next(err)
  }
}
