const { Api500Error } = require("./apiErrors")

const sentenceCase = (camelCase) => {
  const result = camelCase.replace(/([A-Z])/g, " $1")
  return result[0].toUpperCase() + result.substring(1).toLowerCase()
}

exports.sentenceCase = sentenceCase

const selfSearch = (userId) => {
  return { where: { userId: userId } }
}

exports.selfSearch = selfSearch

const whereSearch = (whereOption, otherOptions) => {
  return {
    where: whereOption,
    ...otherOptions,
  }
}

exports.whereSearch = whereSearch

const inputsToSearch = (req, defaultSearch, otherOptions, nameOfTable) => {
  nameOfTable = nameOfTable.toLowerCase()
  const { userId, username, photoId } = req.body
  const inputs = [{ userId }, { username }, { photoId }]

  let searchParams = defaultSearch
  let afterMsg = ""

  const definedInputs = inputs.filter((input) => {
    return Object.values(input)[0] !== undefined
  })

  if (definedInputs.length === 0) {
    return { afterMsg, searchParams }
  }

  if (definedInputs.length > 2) {
    throw new Api500Error(
      `User: ${req.session.user.id} something went wrong with ` +
        nameOfTable +
        // eslint-disable-next-line quotes
        '\'s "allowedBodyInputsValidator" function in the validators.'
    )
  }

  searchParams = whereSearch(...definedInputs, otherOptions)

  afterMsg =
    "with given " +
    sentenceCase(Object.keys(definedInputs[0])[0]) +
    ` ${Object.values(definedInputs[0])[0]}.`

  definedInputs.shift()

  if (definedInputs.length === 2) {
    afterMsg =
      afterMsg.substring(0, afterMsg.length - 1) +
      ", and " +
      sentenceCase(Object.keys(definedInputs[0])[0]) +
      `= ${Object.values(definedInputs[0])[0]}.`
  }

  return { afterMsg, searchParams }
}

exports.inputsToSearch = inputsToSearch
