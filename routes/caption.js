const express = require("express")
const captionRouter = express.Router()
const { captionControllers } = require("../controllers/index")

captionRouter.post("/", captionControllers.postCaption)

captionRouter.get("/", captionControllers.getCaptions)

captionRouter.get("/", captionControllers.getCaption)

captionRouter.put("/", captionControllers.putCaption)

captionRouter.delete("/", captionControllers.deleteCaptions)

captionRouter.delete("/", captionControllers.deleteCaption)

module.exports = captionRouter
