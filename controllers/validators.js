const { body, param } = require("express-validator")
const models = require("../database/models")
const { Api400Error } = require("../util/apiErrors")

const basicValidationChain = (requestValue, bodyOrParam, optional = false) => {
  const capatalizedValue =
    requestValue.charAt(0).toUpperCase() + requestValue.slice(1)
  let head = ""
  if (bodyOrParam === "param") {
    head = param(requestValue)
  }
  if (bodyOrParam === "body") {
    head = body(requestValue)
  }

  if (!head) {
    throw new Error(
      `Programming error: Validator chain function with first input of ${requestValue} has a bad input in the second paramter.`
    )
  }
  if (optional) {
    head = head.if(head.exists())
  }
  return head
    .not()
    .isEmpty()
    .withMessage(capatalizedValue + " must not be empty.")
    .custom(async (value) => {
      if (value.includes(" ")) {
        throw new Error(capatalizedValue + " must no have any blank spaces.")
      }
    })
}

exports.credentialsValidator = [
  basicValidationChain("username", "body"),
  basicValidationChain("password", "body"),
]

exports.registerValidator = [
  basicValidationChain("username", "body")
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "Username must be at least 4 characters and at most 15 characters."
    ),
  basicValidationChain("password", "body")
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "Password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("Password must contain a number.")
    .matches("[A-Z]")
    .withMessage("Password must contain an uppercase letter."),
]

exports.paramUserValidator = [basicValidationChain("username", "param")]

exports.putUserValidator = [
  basicValidationChain("username", "body"),
  basicValidationChain("password", "body"),
  basicValidationChain("newUsername", "body", true)
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "New username must be at least 4 characters and at most 15 characters."
    ),
  basicValidationChain("newPassword", "body", true)
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "New password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("New password must contain a number.")
    .matches("[A-Z]")
    .withMessage("New password must contain an uppercase letter."),
]
