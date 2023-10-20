const { body, param } = require("express-validator")
const models = require("../database/models")
const { Api400Error, Api500Error } = require("../util/index").apiErrors
const { validationResult, matchedData } = require("express-validator")

const basicValidationChain = (requestValue, bodyOrParam, optional = false) => {
  let head = ""
  if (bodyOrParam === "param") {
    head = param(requestValue)
  }
  if (bodyOrParam === "body") {
    head = body(requestValue)
  }

  if (!head) {
    throw new Error(
      `Programming error: Basic validator chain function with first input of ${requestValue} has a bad input in the second paramter.`
    )
  }
  if (optional) {
    head = head.if(head.exists())
  }
  return head
    .not()
    .isEmpty()
    .withMessage(requestValue + " must not be empty.")
}

const basicCredentialValidationChain = (
  requestValue,
  bodyOrParam,
  optional = false
) => {
  let head = ""
  if (bodyOrParam === "param") {
    head = param(requestValue)
  }
  if (bodyOrParam === "body") {
    head = body(requestValue)
  }

  if (!head) {
    throw new Error(
      `Programming error: Basic validator chain function with first input of ${requestValue} has a bad input in the second paramter.`
    )
  }
  if (optional) {
    head = head.if(head.exists())
  }
  return head
    .not()
    .isEmpty()
    .withMessage(requestValue + " must not be empty.")
    .custom(async (value) => {
      if (value.includes(" ")) {
        throw new Error(requestValue + " must no have any blank spaces.")
      }
    })
}

exports.validationCheck = (request = req) => {
  const validationError = validationResult(request).array({
    onlyFirstError: true,
  })[0]
  if (validationError) {
    if (validationError.msg.substr(0, 17) === "Programming error") {
      throw new Api500Error(validationError.msg)
    }
    throw new Api400Error(validationError.msg)
  }

  return matchedData(request)
}

exports.credentialsValidator = [
  basicCredentialValidationChain("username", "body"),
  basicCredentialValidationChain("password", "body"),
]

exports.usernameValidator = [
  basicCredentialValidationChain("username", "param"),
]

exports.registerValidator = [
  basicCredentialValidationChain("username", "body")
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "username must be at least 4 characters and at most 15 characters."
    ),
  basicCredentialValidationChain("password", "body")
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("password must contain a number.")
    .matches("[A-Z]")
    .withMessage("password must contain an uppercase letter."),
]

exports.newCredentialsValidator = [
  basicCredentialValidationChain("newUsername", "body", true)
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "new username must be at least 4 characters and at most 15 characters."
    ),
  basicCredentialValidationChain("newPassword", "body", true)
    .isLength({ min: 8, max: 20 })
    .withMessage(
      "new password must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage("new password must contain a number.")
    .matches("[A-Z]")
    .withMessage("new password must contain an uppercase letter."),
]
