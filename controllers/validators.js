/* eslint-disable quotes */
const { body, param } = require("express-validator")
const { Api400Error } = require("../util/index").apiErrors
const { sentenceCase } = require("../util/index").search
const { validationResult, matchedData } = require("express-validator")

const basicCredentialValidator = (
  input,
  inputIsParam = false,
  optional = false
) => {
  const inputName = sentenceCase(input)
  let requestProperty = inputIsParam ? param : body
  let head = requestProperty(input)

  if (!inputIsParam) {
    if (optional) {
      head = head.optional({ nullable: true, checkFalsy: true })
    }

    head = head.notEmpty().withMessage(inputName + " must not be empty.")
  }

  return head.custom((value) => {
    if (value.includes(" ")) {
      throw new Error(inputName + " must no have any blank spaces.")
    }
    return true
  })
}

const usernameValidator = (
  input = "username",
  inputIsParam = false,
  optional = false
) => {
  const inputName = sentenceCase(input)
  const head = basicCredentialValidator(input, inputIsParam, optional)
  return head
    .isLength({ min: 4, max: 20 })
    .withMessage(
      inputName + " must be at least 4 characters and at most 20 characters."
    )
}

exports.usernameValidator = usernameValidator

const passwordValidator = (
  input = "password",
  inputIsParam = false,
  optional = false
) => {
  const inputName = sentenceCase(input)
  const head = basicCredentialValidator(input, inputIsParam, optional)

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
  const inputName = sentenceCase(input)
  const requestProperty = inputIsParam ? param : body
  let head = requestProperty(input)

  if (optional) {
    head = head.optional({ nullable: true, checkFalsy: true })
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

const incrementValidator = (input) => {
  const { head } = basicValidator(input, false, false)

  return head.custom((voteValue) => {
    if (voteValue === 1 || voteValue === -1) return true

    throw new Error(
      `the voteValue in the request body object must either be -1 or 1.`
    )
  })
}

exports.incrementValidator = incrementValidator

const captionsMultiInputCheck = (allowedInputsInBody) => {
  if (
    !allowedInputsInBody.includes("userId") &&
    !allowedInputsInBody.includes("photoId")
  ) {
    throw Error(
      'the request body object must include "photoId" and "userId" if two key-value pairs are given.'
    )
  }

  return true
}

const allowedBodyInputsValidator = (
  allowedInputs,
  isCaptionsRoute = false,
  maxAllowedInputs = false
) => {
  if (!maxAllowedInputs) {
    maxAllowedInputs = allowedInputs.length - 1
  }

  let afterNonUniqueErrorMsg = ""

  for (let i = 0; i < allowedInputs.length; i++) {
    if (parseInt(i) === allowedInputs.length - 1) {
      afterNonUniqueErrorMsg += 'or "' + allowedInputs[parseInt(i)] + '."'
      continue
    }

    afterNonUniqueErrorMsg += '"' + allowedInputs[parseInt(i)] + '", '
  }

  return body()
    .optional()
    .custom((body) => {
      const requestBodyKeys = Object.keys(body)

      const allowedInputsInBody = requestBodyKeys.filter((key) => {
        return allowedInputs.includes(key)
      })

      const numberOfBodyAllowedInputs = allowedInputsInBody.length

      if (numberOfBodyAllowedInputs <= 1) {
        return true
      }

      if (numberOfBodyAllowedInputs > maxAllowedInputs) {
        throw new Error(
          `the request body object only allows ${maxAllowedInputs} or less than of the following: ` +
            afterNonUniqueErrorMsg
        )
      }

      if (isCaptionsRoute) return captionsMultiInputCheck(allowedInputsInBody)

      return true
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

exports.credentialsValidator = () => {
  return [usernameValidator(), passwordValidator()]
}

exports.newCredentialsValidator = () => {
  return [
    usernameValidator("newUsername", false, true),
    passwordValidator("newPassword", false, true),
  ]
}

exports.postPhotosValidator = () => {
  return [textValidator("title")]
}

exports.getPhotosValidator = () => {
  return [
    textValidator("title", false, true),
    integerValidator("userId", false, true),
    allowedBodyInputsValidator(["title", "userId"], false, 1),
  ]
}

exports.deletePhotosValidator = () => {
  return [integerValidator("userId", false, true)]
}

exports.postCaptionsValidator = () => {
  return [integerValidator("photoId"), textValidator("text")]
}

exports.getCaptionsValidator = () => {
  return [
    integerValidator("userId", false, true),
    integerValidator("photoId", false, true),
    allowedBodyInputsValidator(["userId", "photoId"], true, 2),
  ]
}

exports.deleteCaptionsValidator = () => {
  return [
    integerValidator("userId", false, true),
    integerValidator("photoId", false, true),
    allowedBodyInputsValidator(["userId", "photoId"], true, 2),
  ]
}

exports.votesValidator = () => {
  return [incrementValidator("voteValue")]
}

exports.getVotesValidator = () => {
  return [integerValidator("userId", false, true)]
}
