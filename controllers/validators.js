const { body, param } = require("express-validator")
const { Api400Error, Api500Error } = require("../util/index").apiErrors
const { validationResult, matchedData } = require("express-validator")
const { head } = require("../routes/photos")

const sentenceCase = (camelCase) => {
  const result = camelCase.replace(/([A-Z])/g, " $1")
  return result[0].toUpperCase() + result.substring(1).toLowerCase()
}

exports.sentenceCase = sentenceCase

const basicCredentialValidator = (
  input,
  inputIsParam = false,
  optional = false
) => {
  let head = param(input)

  const inputName = sentenceCase(input)

  if (!inputIsParam) {
    head = body(input)

    if (optional) {
      head = head.if(head.exists())
    }

    head = head.notEmpty().withMessage(input + " must not be empty.")
  }

  return {
    head: head.custom((value) => {
      if (value.includes(" ")) {
        throw new Error(inputName + " must no have any blank spaces.")
      }
    }),
    inputName,
  }
}

const usernameValidator = (
  input = "username",
  inputIsParam = false,
  optional = false
) => {
  const { head, inputName } = basicCredentialValidator(
    input,
    inputIsParam,
    optional
  )

  return head
    .isLength({ min: 4, max: 20 })
    .withMessage(
      inputName + " must be at least 4 characters and at most 15 characters."
    )
}

exports.usernameValidator = usernameValidator

const passwordValidator = (
  input = "password",
  inputIsParam = false,
  optional = false
) => {
  const { head, inputName } = basicCredentialValidator(
    input,
    inputIsParam,
    optional
  )

  return head
    .isLength({ min: 8, max: 20 })
    .withMessage(
      inputName + " must be at least 8 characters and at most 20 characters."
    )
    .matches("[0-9]")
    .withMessage(inputName + " must contain a number.")
    .matches("[A-Z]")
    .withMessage(inputName + " must contain an uppercase letter.")
}

exports.passwordValidator = passwordValidator

const basicValidator = (input, inputIsParam = false, optional = false) => {
  let head = param(input)

  const inputName = sentenceCase(input)

  if (!inputIsParam) {
    head = body(input)

    if (optional) {
      head = head.if(head.exists())
    }
  }

  return { head, inputName }
}

const integerValidator = (input, inputIsParam = false, optional = false) => {
  const { head, inputName } = basicValidator(input, inputIsParam, optional)

  return head.isInt().withMessage(inputName + " must be an integer.")
}

exports.integerValidator = integerValidator

const textValidator = (input, inputIsParam = false, optional = false) => {
  const { head, inputName } = basicValidator(input, inputIsParam, optional)

  return head
    .trim()
    .notEmpty()
    .withMessage(inputName + " must not be empty.")
}

exports.textValidator = textValidator

const captionsMultiInputCheck = (body) => {
  if (Object.keys(body).length > 2) {
    throw Error(
      "the request body object must be non-existent, one, or two key-value pairs."
    )
  }

  if (!Object.keys(body).includes("photoId")) {
    throw Error(
      `the request body object must include "photoId" if two key-value pairs are given.`
    )
  }

  if (
    !Object.keys(body).includes("username") ||
    !Object.keys(body).includes("userId")
  ) {
    throw Error(
      `the request body object must include either "username" or "userId" along with "photoId" if two key-value pairs are given.`
    )
  }
  return true
}

const allowedBodyInputsValidator = (inputs, isCaptionsRoute = false) => {
  let afterNonUniqueErrorMsg = ""

  for (let i = 0; i < inputs.length; i++) {
    if (i === inputs.length - 1) {
      afterNonUniqueErrorMsg += 'or "' + inputs[i] + '."'
    }

    afterNonUniqueErrorMsg += inputs[i] + ", "
  }

  return body()
    .if(body().exists())
    .custom((body) => {
      const keys = inputs
      const bodyIncludesKeys = Object.keys(body).every((key) => {
        keys.includes(key)
      })

      if (!bodyIncludesKeys) {
        throw Error(
          "the request body key-value pair must either be " +
            afterNonUniqueErrorMsg
        )
      }

      const numberOfBodyKeys = Object.keys(body).length

      if (numberOfBodyKeys <= 1) {
        return true
      }

      if (isCaptionsRoute) return captionsMultiInputCheck(body)

      throw Error(
        "the request body object must be non-existent or only have one key-value pair."
      )
    })
}

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

exports.postPhotosValidator = [textValidator("photoName")]

exports.getPhotosValidator = [
  textValidator("photoName", false, true),
  usernameValidator("username", false, true),
  allowedBodyInputsValidator(["photoName", "username"]),
]

exports.deletePhotosValidator = [
  usernameValidator("username", false, true),
  integerValidator("userId", false, true),
  allowedBodyInputsValidator(["username", "userId"]),
]

exports.postCaptionsValidator = [
  integerValidator("photoId"),
  textValidator("captionText"),
]

exports.getCaptionsValidator = [
  usernameValidator("username", false, true),
  integerValidator("userId", false, true),
  integerValidator("photoId", false, true),
  allowedBodyInputsValidator(["username", "userId", "photoId"], true),
]

exports.deleteCaptionsValidator = [
  usernameValidator("username", false, true),
  integerValidator("userId", false, true),
  integerValidator("photoId", false, true),
  allowedBodyInputsValidator(["username", "userId", "photoId"], true),
]
