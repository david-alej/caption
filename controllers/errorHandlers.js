const { logger } = require("../util/index")
const { BaseError } = require("../util/index")

const logError = (err) => {
  logger.error(err)
}

const logErrorMiddleware = async (err, req, res, next) => {
  logError(err)
  next(err)
}

const returnError = (err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.name)
}

const isOperationalError = (error) => {
  if (error instanceof BaseError) {
    return error.isOperational
  }
  return false
}

module.exports = {
  logError,
  logErrorMiddleware,
  returnError,
  isOperationalError,
}
