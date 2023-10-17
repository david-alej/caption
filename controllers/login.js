const models = require("../database/models")

exports.getLogin = async (req, res) => {
  res.render("login")
}
exports.postLogin = async (req, res, next) => {
  try {
    const user = await models.User.findOne({
      where: {
        username: req.body.user.username,
      },
    })
    if (user.dataValues.password === req.body.user.password) {
      req.session.authenticated = true
      req.session.user = {
        username: req.body.user.username,
        password: req.body.user.password,
      }
      res.status(200).send()
    }
    res.status(404).send()
  } catch (err) {
    next(err)
  }
}
