const { validationResult, matchedData } = require("express-validator")
const models = require("../database/models")
const { Api404Error, Api400Error, Api500Error } =
  require("../util/index").apiErrors
const { passwordHash } = require("../util/index").passwordHash

exports.getRegister = async (req, res) => {
  // res.render("register")
  res.status(200).send()
}

exports.postRegister = async (req, res, next) => {
  const saltRounds = 10
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

    user = await models.User.findOne({
      where: { username },
    })

    if (user) {
      throw new Api400Error("Username is already in use.")
    }

    const hashedPassword = await passwordHash(password, saltRounds)
    const user = await models.User.create({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!user) {
      throw new Api500Error(
        `Creating user query failed and was unable to finish.`
      )
    }

    res.status(201).json(`User with username: ${username} is created.`)
  } catch (err) {
    next(err)
  }
}
