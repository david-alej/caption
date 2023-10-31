const { generateToken } = require("../util/index").doubleCsrf

exports.getLogout = async (req, res) => {
  res.status(200).send()
}

exports.postLogout = async (req, res, next) => {
  const user = req.session.user
  try {
    req.session.authorized = false

    generateToken(req, res, true)

    res.json(`User: ${user.id} is now logged out.`)
  } catch (err) {
    next(err)
  }
}
