const { body, param } = require("express-validator")
const models = require("../database/models")

const notEmptyValidationChain = (requestValue, bodyOrParam) => {
  const capatalizedValue =
    requestValue.charAt(0).toUpperCase() + requestValue.slice(1)
  if (bodyOrParam === "param") {
    return param(requestValue, capatalizedValue + " must not be empty.")
      .trim()
      .not()
      .isEmpty()
  }
  if (bodyOrParam === "body") {
    return body(requestValue, capatalizedValue + " must not be empty.")
      .trim()
      .not()
      .isEmpty()
  }
  throw new Error(
    `Programming error: Validator chain function with first input of ${requestValue} has a bad input in the second paramter.`
  )
}

exports.loginValidator = [
  notEmptyValidationChain("username", "body"),
  notEmptyValidationChain("password", "body"),
]

exports.registerValidator = [
  notEmptyValidationChain("username", "body")
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
    .withMessage("Password must contain an uppercase letter."),
]

exports.usernameValidator = [
  notEmptyValidationChain("username", "param").custom(async (value) => {
    user = await models.User.findOne({
      where: { username: value },
      include: models.Photo,
    })
    if (!user) {
      throw new Error(`User with username: ${username} not found.`)
    }
    value = JSON.stringify(user)
  }),
]

exports.putUserValidator = [
  notEmptyValidationChain("username", "body"),
  notEmptyValidationChain("password", "body"),
  body("newUsername")
    .if(body("newUsername").exists())
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "New username must be at least 4 characters and at most 15 characters."
    )
    .custom(async (value) => {
      user = await models.User.findOne({
        where: { username },
      })
      if (user) {
        throw new Error("New username is already in use.")
      }
    }),
  body("newPassword")
    .if(body("newPassword").exists())
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "New password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("New password must contain a number.")
    .matches("[A-Z]")
    .withMessage("New password must contain an uppercase letter."),
]
