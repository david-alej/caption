const { Api429Error } = require("../util/index").apiErrors
const { Redis } = require("../util/index")

const { RateLimiterMemory } = require("rate-limiter-flexible")
require("dotenv").config()

const oneMinute = process.env.NODE_ENV === "production" ? 60 : 1

const generalRateLimiterMemory = new RateLimiterMemory({
  points: 60,
  duration: oneMinute,
})

const generalRateLimiter = Redis.createRateLimiter({
  points: 300,
  duration: oneMinute,
  inMemoryBlockOnConsumed: 301,
  inMemoryBlockDuration: oneMinute,
  insuranceLimiter: generalRateLimiterMemory,
})

const photosRateLimiterMemory = new RateLimiterMemory({
  points: 5,
  duration: oneMinute,
})

const photosRateLimiter = Redis.createRateLimiter({
  keyPrefix: "photosRL",
  points: 10,
  duration: oneMinute,
  inMemoryBlockOnConsumed: 301,
  inMemoryBlockDuration: oneMinute,
  insuranceLimiter: photosRateLimiterMemory,
})

const rateLimiter = async (req, res, next) => {
  const userIsAuthorized =
    typeof req.session !== "undefined" && req.session.authorized === true
  const key = userIsAuthorized ? req.session.user.id : req.ip
  let pointsToConsume
  let limiter

  try {
    if (req.originalUrl.indexOf("/photos") === 0) {
      pointsToConsume = userIsAuthorized ? 1 : 5
      limiter = await photosRateLimiter
    } else {
      pointsToConsume = userIsAuthorized ? 1 : 30
      limiter = await generalRateLimiter
    }

    await limiter.consume(key, pointsToConsume)

    next()
  } catch (err) {
    if (typeof err.msBeforeNext === "undefined") return next(err)

    const preMsg = userIsAuthorized ? "User: " + req.session.user.id : "Client:"

    const retrySecs = Math.round(err.msBeforeNext / 1000) || 1

    const afterErrorMsg = ` has made to many request to the original url, ${req.originalUrl}, next retry is after ${retrySecs} seconds.`

    next(new Api429Error(preMsg + afterErrorMsg))
  }
}

exports.rateLimiter = rateLimiter
