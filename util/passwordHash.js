const bcrypt = require("bcrypt")

exports.passwordHash = async (password, saltRounds) => {
  const salt = await bcrypt.genSalt(saltRounds)
  return await bcrypt.hash(password, salt)
}
