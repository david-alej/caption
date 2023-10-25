const { validationPerusal } = require("./validators")
const models = require("../database/models")
const { authenticate } = require("../util/index").authenticate
const { Api400Error, Api401Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramUsername = async (req, res, next, username) => {
  const user = req.session.user
  try {
    const { username } = validationPerusal(req, `User: ${user.id}`)

    if (username === "") {
      req.targetUser = user
      next()
      return
    }

    const searched = await models.User.findOne({
      where: { username },
      include: models.Photo,
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    if (!searched) {
      throw new Api404Error(
        `User: ${user.id} target username ${username} not found.`
      )
    }

    req.targetUser = searched.dataValues
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
  const targetUser = req.targetUser
  try {
    req.json(targetUser)
  } catch (err) {
    next(err)
  }
}

exports.putUser = async (req, res, next) => {
  const user = req.session.user
  try {
    const { username, password, newUsername, newPassword } = validationPerusal(
      req,
      `User: ${user.id}`
    )

    const searched = await models.User.findOne({
      where: { username: newUsername },
    })

    if (searched) {
      throw new Api400Error(
        `User: ${user.id} new username, ${newUsername}, is already in use.`
      )
    }

    if (!newUsername && !newPassword) {
      throw new Api400Error(`User: ${user.id} did not update any values.`)
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
      throw new Api500Error(`User: ${user.id} update user query did not work.`)
    }
    res
      .status(204)
      .send(
        `User: ${user.id} has updated either/both their username or password.`
      )
  } catch (err) {
    next(err)
  }
}

exports.deleteUser = async (req, res, next) => {
  const user = req.session.user
  const targetUser = req.targetUser
  const targetIsSelf = user.id === targetUser.id
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted their own account.`
    : `User: ${user.id} has deleted user ${targetUser.id}.`

  try {
    if (!user.isAdmin || !targetIsSelf) {
      throw new Api401Error(
        `User: ${user.id} is not authorized to delete a users.`
      )
    }

    const { username, password } = validationPerusal(req, `User: ${user.id}`)

    await authenticate(username, password)

    const deleted = await models.User.destroy({
      where: {
        id: targetUser.id,
        isAdmin: false,
      },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete a user query did not work because query went wrong or the target user is an admin.`
      )
    }

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}
