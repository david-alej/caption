const { validationPerusal, usernameValidator } = require("./validators")
const models = require("../database/models")
const { authenticate } = require("../util/index").authenticate
const { Api400Error, Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors
const { passwordHash } = require("../util/index").passwordHash
const { generateToken } = require("../util/index").doubleCsrf

exports.paramUsername = async (req, res, next, username) => {
  const user = req.session.user

  try {
    await usernameValidator("username", true).run(req)

    validationPerusal(req, `User: ${user.id}`)

    const searched = await models.User.findOne({
      where: { username: username },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: models.Photo,
          as: "photos",
          include: [
            {
              model: models.Caption,
              as: "captions",
              order: [["votes", "DESC"]],
            },
          ],
          order: [["id", "DESC"]],
        },
      ],
      order: [["id", "DESC"]],
    })

    if (!searched) {
      throw new Api404Error(
        `User: ${user.id} target username ${username} not found.`
      )
    }
    req.targetUser = JSON.parse(JSON.stringify(searched))
    next()
  } catch (err) {
    next(err)
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const searched = await models.User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: models.Photo,
          as: "photos",
          include: [
            {
              model: models.Caption,
              as: "captions",
              order: [["votes", "DESC"]],
            },
          ],
          order: [["id", "DESC"]],
        },
      ],
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
    res.json(targetUser)
  } catch (err) {
    next(err)
  }
}

exports.putUser = async (req, res, next) => {
  const user = req.session.user
  const saltRounds = 10

  try {
    validationPerusal(req, `User: ${user.id}`)
    const { username, password, newUsername, newPassword } = req.body

    if (!newUsername && !newPassword) {
      throw new Api400Error(`User: ${user.id} did not update any values.`)
    }

    if (newUsername) {
      const searched = await models.User.findOne({
        where: { username: newUsername },
      })

      if (searched) {
        throw new Api400Error(
          `User: ${user.id} new username, ${newUsername}, is already in use.`
        )
      }
    }

    await authenticate(username, password)

    const hashedPassword = await passwordHash(password, saltRounds)

    const updatedValues = {
      username,
      password: hashedPassword,
      updatedAt: new Date(),
    }

    if (newUsername) {
      updatedValues.username = newUsername
    }

    if (newPassword) {
      const hashedNewPassword = await passwordHash(newPassword, saltRounds)

      updatedValues.password = hashedNewPassword
    }

    const updated = await models.User.update(updatedValues, {
      where: { id: user.id },
    })

    if (!updated) {
      throw new Api500Error(`User: ${user.id} update user query did not work.`)
    }
    res.send(
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
    if (!targetIsSelf && !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} is not authorized to delete a user.`
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

    if (targetIsSelf) {
      req.session.authorized = false

      generateToken(req, res, true)
    }

    res.send(responseMsg)
  } catch (err) {
    next(err)
  }
}
