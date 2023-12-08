const { Api429Error } = require("../util/apiErrors")
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
  const key = userIsAuthorized ? req.user.id : req.ip
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
    if (err.remainingPoints === 0) {
      const preMsg = userIsAuthorized ? "User: " + req.user.id : "Client: "
      const afterErrorMsg =
        " has made to many request to the original url, " +
        req.originalUrl +
        "."

      return next(new Api429Error(preMsg + afterErrorMsg))
    }

    next(err)
  }
}

exports.rateLimiter = rateLimiter

const maxWrongAttemptsByIPperDay = 100
const maxConsecutiveFailsByUsernameAndIP = 10

const oneDay = process.env.NODE_ENV === "production" ? 60 * 60 * 24 : 1
const ninetyDays = process.env.NODE_ENV === "production" ? 60 * 60 * 24 * 90 : 1
const oneHour = process.env.NODE_ENV === "production" ? 60 * 60 : 1

const limiterSlowBruteByIP = Redis.createRateLimiter({
  useRedisPackage: true,
  keyPrefix: "login_fail_ip_per_day",
  points: maxWrongAttemptsByIPperDay,
  duration: oneDay,
  blockDuration: oneDay,
})

const limiterConsecutiveFailsByUsernameAndIP = Redis.createRateLimiter({
  keyPrefix: "login_fail_consecutive_username_and_ip",
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: ninetyDays,
  blockDuration: oneHour,
})

const getUsernameIPkey = (username, ip) => `${username}_${ip}`

const loginLimiterCheck = async (req, res, next) => {
  const ipAddr = req.ip

  const usernameIPkey = getUsernameIPkey(req.body.email, ipAddr)

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(ipAddr),
  ])

  req.usernameIPkey = usernameIPkey
  req.resUsernameAndIP = resUsernameAndIP

  let retrySecs = 0

  if (
    resSlowByIP !== null &&
    resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
  ) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1
  } else if (
    resUsernameAndIP !== null &&
    resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP
  ) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1
  }

  if (retrySecs > 0) {
    throw new Api429Error(
      "Client: has made to many request to the original url, " +
        req.originalUrl +
        ", please retry after" +
        String(retrySecs) +
        " seconds."
    )
  } else {
    next()
  }
}

exports.loginLimiterCheck = loginLimiterCheck

const loginLimiterConsume = async (req, res, next) => {
  const ipAddr = req.ip
  const usernameIPkey = req.usernameIPkey
  try {
    const promises = [limiterSlowBruteByIP.consume(ipAddr)]
    if (user.exists) {
      promises.push(
        limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)
      )
    }

    await Promise.all(promises)

    res.status(400).end("email or password is wrong")
  } catch (rlRejected) {
    if (rlRejected instanceof Error) {
      throw rlRejected
    } else {
      res.set(
        "Retry-After",
        String(Math.round(rlRejected.msBeforeNext / 1000)) || 1
      )
      res.status(429).send("Too Many Requests")
    }
  }

  if (user.isLoggedIn) {
    if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
      // Reset on successful authorisation
      await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey)
    }

    res.end("authorized")
  }
}

exports.loginLimiterConsume = loginLimiterConsume
