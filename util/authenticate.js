const bcrypt = require("bcrypt")
const models = require("../database/models")
const { Api401Error } = require("./apiErrors")

const usernameExists = async (username) => {
  const user = await models.User.findOne({
    where: {
      username,
    },
  })

  if (!user) {
    throw new Api401Error(`Client: username ${username} not found.`)
  }

  return user.dataValues
}

const correctPassword = async (user, password) => {
  const passwordsMatch = await bcrypt.compare(password, user.password)

  if (!passwordsMatch) {
    throw new Api401Error(
      `Client: with chosen user id ${user.id} has input an incorrect password.`
    )
  }

  return false
}

const authenticate = async (username, password) => {
  const user = await usernameExists(username)

  await correctPassword(user, password)

  return user, false
}

module.exports = { usernameExists, correctPassword, authenticate }
