const { body, param } = require("express-validator")
const { Api400Error, Api500Error } = require("../util/index").apiErrors
const { validationResult, matchedData } = require("express-validator")

const sentenceCase = (camelCase) => {
  const result = camelCase.replace(/([A-Z])/g, " $1")
  return result[0].toUpperCase() + result.substring(1).toLowerCase()
}

const bodyValidator = (requestValue, optional = false) => {
  let head = body(requestValue)

  if (optional) {
    head = head.if(head.exists())
  }
  return head.notEmpty().withMessage(requestValue + " must not be empty.")
}

const basicValidator = (
  requestValue,
  isParamCheck = false,
  optional = false
) => {
  let head = param(requestValue)

  if (!isParamCheck) {
    head = bodyValidator(requestValue, optional)
  }

  return head.custom((value) => {
    if (value.includes(" ")) {
      throw new Error(requestValue + " must no have any blank spaces.")
    }
  })
}

const usernameValidator = (
  requestValue = "username",
  isParamCheck = false,
  optional = false
) => {
  const requestName = sentenceCase(requestValue)
  return basicValidator(requestValue, isParamCheck, optional)
    .isLength({ min: 4, max: 20 })
    .withMessage(
      requestName + " must be at least 4 characters and at most 15 characters."
    )
}

exports.usernameValidator = usernameValidator

const passwordValidator = (
  requestValue = "password",
  isParamCheck = false,
  optional = false
) => {
  const requestName = sentenceCase(requestValue)
  return basicValidator(requestValue, isParamCheck, optional)
    .isLength({ min: 8, max: 20 })
    .withMessage(
      requestName + " must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage(requestName + " must contain a number.")
    .matches("[A-Z]")
    .withMessage(requestName + " must contain an uppercase letter.")
}

exports.passwordValidator = passwordValidator

const paramIntegerValidator = (requestValue) => {
  return param(requestValue).isInt().withMessage("must be an integer.")
}

exports.paramIntegerValidator = paramIntegerValidator

const paramTextValidator = (requestValue) => {
  return param(requestValue)
    .trim()
    .notEmpty()
    .withMessage(requestValue + " must not be empty.")
}

exports.paramTextValidator = paramTextValidator

exports.validationPerusal = (request, preErrorMsg) => {
  const validationError = validationResult(request).array({
    onlyFirstError: true,
  })[0]

  if (validationError) {
    throw new Api400Error(preErrorMsg + " " + validationError.msg)
  }

  return matchedData(request)
}

exports.credentialsValidator = [usernameValidator(), passwordValidator()]

exports.newCredentialsValidator = [
  usernameValidator("newUsername", false, true),
  passwordValidator("newPassword", false, true),
]
