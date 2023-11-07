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

  let afterMsg = "."
  let numberOfdefinedInputs = 0

  for (let i = 0; i < inputs.length; i++) {
    const key = Object.keys(inputs[parseInt(i)])[0]
    const value = Object.values(inputs[parseInt(i)])[0]

    if (value !== undefined) {
      numberOfdefinedInputs++
    }

    if (numberOfdefinedInputs === 2) {
      afterMsg =
        afterMsg.substring(0, afterMsg.length - 1) +
        ", and " +
        sentenceCase(key) +
        ` ${value}.`

      searchParams = whereSearch(
        { ...inputs[0], ...inputs[parseInt(i)] },
        otherOptions
      )
    } else if (numberOfdefinedInputs === 1) {
      afterMsg = " with given " + sentenceCase(key) + ` ${value}.`

      searchParams = whereSearch(inputs[parseInt(i)], otherOptions)
    }
  }

  if (numberOfdefinedInputs > 2) {
    throw new Api500Error(
      `User: ${req.session.user.id} something went wrong with ` +
        nameOfTable +
        // eslint-disable-next-line quotes
        '\'s "allowedBodyInputsValidator" function in the validators.'
    )
  }
  console.log(numberOfdefinedInputs, searchParams)

  return { afterMsg, searchParams }
}

exports.inputsToSearch = inputsToSearch
