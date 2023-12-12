/* eslint no-process-exit: 0 */

const votesRouter = require("./votes")
const captionsRouter = require("./captions")
const loginRouter = require("./login")
const logoutRouter = require("./logout")
const photosRouter = require("./photos")
const registerRouter = require("./register")
const usersRouter = require("./users")

const { authorizedUser } = require("../controllers/index").authorize
const { logError, logErrorMiddleware, returnError, isOperationalError } =
  require("../controllers/index").errorHandlers
const { doubleCsrfProtection } = require("../util/index").doubleCsrf
const { rateLimeter } = require("../controllers/index").rateLimiter

const router = require("express").Router()

if (process.env.NODE_ENV === "development") router.use(rateLimeter)

router.get("/", (req, res) => {
  res.send("Welcome to the social media app Caption!!")
})

router.use("/login", loginRouter)
router.use("/register", registerRouter)

router.use(authorizedUser)
router.use(doubleCsrfProtection)

router.use("/votes", votesRouter)
router.use("/captions", captionsRouter)
router.use("/photos", photosRouter)
router.use("/users", usersRouter)
router.use("/logout", logoutRouter)

router.use(logErrorMiddleware, returnError)

process.on("unhandledRejection", (err) => {
  throw err
})

process.on("uncaughtException", (err) => {
  logError(err)

  if (!isOperationalError(err)) {
    process.exit(1)
  }
})

module.exports = router
