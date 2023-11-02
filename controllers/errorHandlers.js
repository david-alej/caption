/* eslint-disable no-unused-vars */

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
  res.status(err.statusCode || 500).send(err.message)
}

const isOperationalError = (err) => {
  if (err instanceof BaseError) {
    return err.isOperational
  }
  return false
}

module.exports = {
  logError,
  logErrorMiddleware,
  returnError,
  isOperationalError,
}
