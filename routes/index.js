const captionsRouter = require("./captions")
const loginRouter = require("./login")
const photosRouter = require("./photos")
const registerRouter = require("./register")
const usersRouter = require("./users")

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

router.use("/captions", captionsRouter)
router.use("/photos", photosRouter)
router.use("/users", usersRouter)

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
