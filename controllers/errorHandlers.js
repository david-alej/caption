const { logger } = require("../util/index")

exports.logError = (err) => {
  logger.error(err)
}

exports.logErrorMiddleware = (err, req, res, next) => {
  logError(err)
  next(err)
}

exports.returnError = (err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.name)
}

exports.isOperationalError = (error) => {
  if (error instanceof BaseError) {
    return error.isOperational
  }
  return false
}
