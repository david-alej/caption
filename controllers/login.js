const { validationPerusal } = require("./validators")
const { generateToken } = require("../util/index").doubleCsrf
const { authenticate } = require("../util/index").authenticate

exports.getLogin = async (req, res) => {
  res.status(200).send()
}

exports.postLogin = async (req, res, next) => {
  try {
    const { username, password } = validationPerusal(req, "Client:")

    const user = await authenticate(username, password)

    req.session.authorized = true
    delete user.password
    req.session.user = user

    const csrfToken = generateToken(req, res, true)

    res.json({
      message: `User: ${user.id} is now logged in.`,
      csrfToken,
    })
  } catch (err) {
    next(err)
  }
}
