const captionRouter = require("./caption")
const loginRouter = require("./login")
const photoRouter = require("./photo")
const registerRouter = require("./register")
const userRouter = require("./user")

const { authorizedUser } = require("../controllers/index").authorize
const { logError, logErrorMiddleware, returnError, isOperationalError } =
  require("../controllers/index").errorHandlers
const { doubleCsrfProtection } = require("../util/index").doubleCsrf

const { Router } = require("express")
const router = Router()

router.get("/", (req, res) => {
  res.send("Hurray")
})

router.use("/login", loginRouter)
router.use("/register", registerRouter)

router.use(authorizedUser)
router.use(doubleCsrfProtection)

router.use("/caption", captionRouter)
router.use("/photo", photoRouter)
router.use("/user", userRouter)

router.use(logErrorMiddleware, returnError)

process.on("unhandledRejection", (error) => {
  throw error
})

process.on("uncaughtException", (error) => {
  logError(error)

  if (!isOperationalError(error)) {
    process.exit(1)
  }
})

module.exports = router
