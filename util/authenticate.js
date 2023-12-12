const bcrypt = require("bcrypt")
const models = require("../database/models")

const authenticate = async (username, password) => {
  let user = await models.User.findOne({
    where: {
      username,
    },
  })

  user = JSON.parse(JSON.stringify(user))

  if (!user) return user, false

  const authorized = await bcrypt.compare(password, user.password)

  return { user, authorized }
}

exports.authenticate = authenticate
