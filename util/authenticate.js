const bcrypt = require("bcrypt")
const models = require("../database/models")
const { Api404Error } = require("./apiErrors")

const usernameExists = async (username) => {
  const user = await models.User.findOne({
    where: {
      username,
    },
  })
  if (!user) {
    throw new Api404Error(`User with username: ${username} not found.`)
  }
}

const correctPassword = async (username, password) => {
  const passwordsMatch = await bcrypt.compare(
    password,
    user.dataValues.password
  )
  if (!passwordsMatch) {
    throw new Api404Error(
      `User with username: ${username} input an incorrect password.`
    )
  }
}

const authenticate = async (username, password) => {
  await usernameExists(username)
  await correctPassword(username, password)
}

module.exports = { usernameExists, correctPassword, authenticate }
