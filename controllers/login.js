const { validationCheck } = require("./validators")
const { generateToken } = require("../util/index").doubleCsrf
const { authenticate } = require("../util/index").authenticate

exports.getLogin = async (req, res) => {
  // res.render("login")
  res.status(200).send()
}

exports.postLogin = async (req, res, next) => {
  try {
    const { username, password } = validationCheck(req)

    await authenticate(username, password)

    req.session.authenticated = true
    delete user.dataValues.password
    req.session.user = user.dataValues

    const csrfToken = generateToken(req, res)

    res.json({
      message: `User: ${username} is now logged in.`,
      csrfToken,
    })
  } catch (err) {
    next(err)
  }
}
