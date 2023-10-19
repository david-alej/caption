const models = require("../database/models")

exports.getUsers = async (req, res, next) => {
  try {
    const users = await models.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]],
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
}

exports.getUser = async (req, res, next) => {
  const username = req.username
  try {
    const user = await models.User.findOne({
      where: { username },
    })
  } catch (err) {
    next(err)
  }
}

exports.putUser = async (req, res, next) => {}

exports.deleteUsers = async (req, res, next) => {}

exports.deleteUser = async (req, res, next) => {}
