const express = require("express")
const captionsRouter = express.Router()
const { captionsControllers } = require("../controllers/index")

captionsRouter.post("/", captionsControllers.postCaption)

captionsRouter.get("/", captionsControllers.getCaptions)

captionsRouter.get("/", captionsControllers.getCaption)

captionsRouter.put("/", captionsControllers.putCaption)

captionsRouter.delete("/", captionsControllers.deleteCaptions)

captionsRouter.delete("/", captionsControllers.deleteCaption)

module.exports = captionsRouter
