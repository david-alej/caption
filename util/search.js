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
  const { userId, photoId } = req.body
  const inputs = [{ userId }, { photoId }]

  let searchParams = defaultSearch
  let afterMsg = "."

  let definedInputs = inputs.filter((input) => {
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

  definedInputs = definedInputs.reduce(
    (obj, item) => ({
      ...obj,
      ...item,
    }),
    {}
  )

  searchParams = whereSearch(definedInputs, otherOptions)

  const inputKeys = Object.keys(definedInputs)
  const inputValues = Object.values(definedInputs)
  afterMsg = "with given " + sentenceCase(inputKeys[0]) + `= ${inputValues[0]}.`

  inputKeys.shift()
  inputValues.shift()

  if (Object.keys(definedInputs).length === 2) {
    afterMsg =
      afterMsg.substring(0, afterMsg.length - 1) +
      ", and " +
      sentenceCase(inputKeys[0]) +
      `= ${inputValues[0]}.`
  }

  return { afterMsg, searchParams }
}

exports.inputsToSearch = inputsToSearch
