const { validationPerusal } = require("./validators")
const models = require("../database/models")
const { Api400Error, Api500Error } = require("../util/index").apiErrors
const { passwordHash } = require("../util/index").passwordHash

exports.getRegister = async (req, res) => {
  res.status(200).send()
}

exports.postRegister = async (req, res, next) => {
  const saltRounds = 10
  try {
    const { username, password } = validationPerusal(req, "Client:")

    const searched = await models.User.findOne({
      where: { username: username },
    })

    if (searched) {
      throw new Api400Error(`Client: username ${username} is already in use.`)
    }

    const hashedPassword = await passwordHash(password, saltRounds)

    const created = await models.User.create({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!created) {
      throw new Api500Error(
        "Client: creating user query failed and was unable to finish."
      )
    }

    res.status(201).send(`User: ${created.dataValues.id} is created.`)
  } catch (err) {
    next(err)
  }
}
