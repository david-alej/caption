const morgan = require("morgan")

// const format = json({
//   method: ":method",
//   url: ":url",
//   status: ":status",
//   contentLength: ":res[content-length]",
//   responseTime: ":response-time",
// })
const format = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, "content-length"),
    responseTime: tokens["response-time"](req, res),
  })
}

const logger = require("./logger")
const httpLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, contentLength, responseTime } =
        JSON.parse(message)

      logger.info("HTTP Access Log", {
        timestamp: new Date().toString(),
        method,
        url,
        status: Number(status),
        contentLength,
        responseTime: Number(responseTime),
      })
    },
  },
})

module.exports = httpLogger
