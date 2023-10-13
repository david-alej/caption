const { Router } = require("express")

const router = Router()

router.get("/", (req, res) => {
  res.send("Sent through https, yay!")
})

module.exports = router
