const { Router } = require("express")
const loginRouter = require("./login")
const { errorHandlers } = require("../controllers/index")
const { logErrorMiddleware, returnError, isOperationalError } = errorHandlers
const router = Router()

router.get("/", (req, res) => {
  console.log("App is running using HTTPS protocol.")
  res.send("Hurray")
})

router.use("/login", loginRouter)

router.use(logErrorMiddleware)
router.use(returnError)

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
