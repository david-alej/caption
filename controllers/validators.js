const { body } = require("express-validator")
const models = require("../database/models")

exports.loginValidator = [
  body("username", "Username must be not be empty.")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .custom(async (value) => {
      user = await models.User.findOne({
        where: { username },
      })
      if (user) {
        throw new Error("Username is already in use.")
      }
    }),
  body("password", "Password must be not be empty.")
    .trim()
    .escape()
    .not()
    .isEmpty(),
]

exports.registerValidator = [
  body("username")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Username must be not be empty.")
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "Username must be at least 4 characters and at most 15 characters."
    ),
  body("password")
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "Password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("Password must contain a number.")
    .matches("[A-Z]")
    .withMessage("Password must contain an uppercase letter.")
    .escape(),
]
