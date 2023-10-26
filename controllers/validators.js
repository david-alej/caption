const { body, param } = require("express-validator")
const { Api400Error, Api500Error } = require("../util/index").apiErrors
const { validationResult, matchedData } = require("express-validator")
const { head } = require("../routes/photos")

const sentenceCase = (camelCase) => {
  const result = camelCase.replace(/([A-Z])/g, " $1")
  return result[0].toUpperCase() + result.substring(1).toLowerCase()
}

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

const allowedBodyInputsValidator = (inputs) => {
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
      const numberOfBodyKeys = Object.keys(body).length

      if (numberOfBodyKeys > 1) {
        throw Error(
          "the request body object must be none existent or only have one key-value pair."
        )
      }

      const bodyIncludesKeys = Object.keys(body).every((key) => {
        keys.includes(key)
      })

      if (!bodyIncludesKeys) {
        throw Error(
          "the request body key-value pair must either be " +
            afterNonUniqueErrorMsg
        )
      }
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

exports.getPhotosValidator = [
  textValidator("photoName", true),
  usernameValidator("username", false, true),
  allowedBodyInputsValidator(["photoName", "username"]),
]

exports.deletePhotosValidator = [
  usernameValidator("username", false, true),
  integerValidator("userId", false, true),
  allowedBodyInputsValidator(["username", "userId"]),
]
