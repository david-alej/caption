const httpStatusCodes = require("./httpStatusCodes")
const BaseError = require("./baseError")

class Api400Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.BAD_REQUEST,
    name = "Bad request.",
    isOperational = true
  ) {
    super(description, statusCode, name, isOperational)
  }
}

class Api401Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.UNAUTHORIZED,
    name = "Unauthorized.",
    isOperational = true
  ) {
    super(description, statusCode, name, isOperational)
  }
}

class Api403Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.FORBIDDEN,
    name = "Forbidden.",
    isOperational = true
  ) {
    super(description, statusCode, name, isOperational)
  }
}

class Api404Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.NOT_FOUND,
    name = "Not found.",
    isOperational = true
  ) {
    super(description, statusCode, name, isOperational)
  }
}

class Api429Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.TOO_MANY_REQUESTS,
    name = "Too many requests.",
    isOperational = true
  ) {
    super(description, statusCode, name, isOperational)
  }
}

class Api500Error extends BaseError {
  constructor(
    description,
    statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR,
    name = "Internal server error.",
    isOperational = false
  ) {
    super(description, statusCode, name, isOperational)
  }
}

module.exports = {
  Api400Error,
  Api401Error,
  Api403Error,
  Api404Error,
  Api429Error,
  Api500Error,
}
