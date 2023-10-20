const { validationCheck } = require("./validators")
const models = require("../database/models")
const { authenticate } = require("../util/index").authenticate
const { Api400Error, Api401Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramUser = async (req, res, next, username) => {
  const user = req.session.user
  try {
    const { username } = validationCheck(req)

    const searched = await models.User.findOne({
      where: { username },
      include: models.Photo,
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    if (!searched) {
      throw new Api404Error(`User: ${username} not found.`)
    }

    req.user = user.dataValues
    next()
  } catch (err) {
    next(err)
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const searched = await models.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    res.json(searched)
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
  const user = req.session.user
  try {
    const { username, password, newUsername, newPassword } =
      validationCheck(req)

    const searched = await models.User.findOne({
      where: { username: newUsername },
    })

    if (searched) {
      throw new Api400Error(
        `User: ${username} new username, ${newUsername}, is already in use.`
      )
    }

    if (!newUsername && !newPassword) {
      throw new Api400Error(`User: ${username} did not update any values.`)
    }

    await authenticate(username, password)

    const updatedValues = { username, password, updatedAt: new Date() }
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
      throw new Api500Error(`User: ${username} update user query did not work.`)
    }
    res
      .status(204)
      .send(
        `User: ${username} has updated either/both their username or password.`
      )
  } catch (err) {
    next(err)
  }
}

exports.deleteUsers = async (req, res, next) => {
  const user = req.session.user
  try {
    if (!user.isAdmin) {
      throw new Api401Error(
        `User: ${user.username} is not authorized to delete all users.`
      )
    }

    const { username, password } = validationCheck(req)

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      truncate: true,
    })
    if (!deleted) {
      throw new Api500Error(
        `User: ${username} delete all users query did not work.`
      )
    }
    res.status(204).send(`User: ${username} deleted all users.`)
  } catch (err) {
    next(err)
  }
}

exports.deleteSelf = async (req, res, next) => {
  const user = req.session.user
  try {
    const { username, password } = validationCheck(req)

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      where: {
        id: user.id,
      },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${username} delete own account query did not work.`
      )
    }
    res.status(204).json(`User: ${username} has deleted their own account.`)
  } catch (err) {
    next(err)
  }
}

exports.delteUser = async (req, res, next) => {
  const user = req.session.user
  const targetUser = req.user
  try {
    if (!user.isAdmin) {
      throw new Api401Error(
        `User: ${user.username} is not authorized to delete a users.`
      )
    }

    const { username, password } = validationCheck(req)

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      where: {
        id: targetUser.id,
        isAdmin: false,
      },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${username} delete a user query did not work because query went wrong or you target user is an admin.`
      )
    }
    res
      .status(204)
      .send(`User: ${username} has deleted user ${targetUser.username}.`)
  } catch (err) {
    next(err)
  }
}
