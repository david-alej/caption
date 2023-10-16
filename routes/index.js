const { Router } = require("express")
const loginRouter = require("./login")

const router = Router()

router.get("/", (req, res) => {
  console.log("App is running using HTTPS protocol.")
})

router.use("/login", loginRouter)

module.exports = router
