const { validationPerusal } = require("./validators")
const { generateToken } = require("../util/index").doubleCsrf
const { authenticate } = require("../util/index").authenticate
const { Redis } = require("../util/index")
const { Api401Error, Api429Error } = require("../util/index").apiErrors

const { RateLimiterMemory } = require("rate-limiter-flexible")

const maxWrongAttemptsByIPperDay = 100
const maxConsecutiveFailsByUsernameAndIP = 10

const oneHour = process.env.NODE_ENV === "production" ? 60 * 60 : 1
const oneDay = process.env.NODE_ENV === "production" ? 60 * 60 * 24 : 1
const ninetyDays = process.env.NODE_ENV === "production" ? 60 * 60 * 24 * 90 : 1

const bruteRateLimiterMemory = new RateLimiterMemory({
  points: 60,
  duration: oneDay,
})

const limiterSlowBruteByIP = Redis.createRateLimiter({
  useRedisPackage: true,
  keyPrefix: "login_fail_ip_per_day",
  points: maxWrongAttemptsByIPperDay,
  duration: oneDay,
  blockDuration: oneDay,
  inMemoryBlockOnConsumed: maxWrongAttemptsByIPperDay + 1,
  inMemoryBlockDuration: oneDay,
  insuranceLimiter: bruteRateLimiterMemory,
})

const consecutiveRateLimiterMemory = new RateLimiterMemory({
  points: 60,
  duration: oneDay * 23,
})

const limiterConsecutiveFailsByUsernameAndIP = Redis.createRateLimiter({
  keyPrefix: "login_fail_consecutive_username_and_ip",
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: ninetyDays,
  blockDuration: oneHour,
  inMemoryBlockOnConsumed: maxConsecutiveFailsByUsernameAndIP + 1,
  inMemoryBlockDuration: oneHour,
  insuranceLimiter: consecutiveRateLimiterMemory,
})

const getUsernameIPkey = (username, ip) => `${username}_${ip}`

exports.getLogin = async (req, res) => {
  res.status(200).send()
}

exports.postLogin = async (req, res, next) => {
  const ipAddr = req.ip
  const { username, password } = req.body
  const usernameIPkey = getUsernameIPkey(username, ipAddr)

  try {
    validationPerusal(req, "Client:")

    const consecutveFailsLimiter = await limiterConsecutiveFailsByUsernameAndIP
    const slowBruteLimiter = await limiterSlowBruteByIP

    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
      consecutveFailsLimiter.get(usernameIPkey),
      slowBruteLimiter.get(ipAddr),
    ])

    let retryMS = 0

    if (
      resSlowByIP !== null &&
      resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
    ) {
      retryMS = resSlowByIP.msBeforeNext
    } else if (
      resUsernameAndIP !== null &&
      resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP
    ) {
      retryMS = resUsernameAndIP.msBeforeNext
    }

    if (retryMS > 0) {
      throw { msBeforeNext: retryMS }
    }

    const { user, authorized } = await authenticate(username, password)

    req.session.authorized = authorized
    if (user) delete user.password
    req.session.user = user

    if (!authorized) {
      let errorMsg = `Client: username ${username} not found.`
      const promises = [slowBruteLimiter.consume(ipAddr)]

      if (user) {
        errorMsg = `Client: with chosen user id ${user.id} has input an incorrect password.`

        promises.push(consecutveFailsLimiter.consume(usernameIPkey))
      }

      await Promise.all(promises)

      throw new Api401Error(errorMsg)
    }

    if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
      await consecutveFailsLimiter.delete(usernameIPkey)
    }

    const csrfToken = generateToken(req, res, true)

    res.send({
      message: `User: ${user.id} is now logged in.`,
      csrfToken,
    })
  } catch (err) {
    if (typeof err.msBeforeNext === "undefined") return next(err)

    const preMsg =
      typeof req.session.user !== "undefined"
        ? `User: ${req.session.user.id}`
        : "Client:"

    const retrySecs = Math.round(err.msBeforeNext / 1000) || 1

    const afterErrorMsg = ` has made to many request to the original url, ${req.originalUrl}, next retry is after ${retrySecs} seconds.`

    next(new Api429Error(preMsg + afterErrorMsg))
  }
}
