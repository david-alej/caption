const morgan = require("morgan")

// const format = json({
//   method: ":method",
//   url: ":url",
//   status: ":status",
//   contentLength: ":res[content-length]",
//   responseTime: ":response-time",
// })
const format = (tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, "content-length"),
    "-",
    tokens["response-time"](req, res),
    "ms",
  ].join(" ")
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
