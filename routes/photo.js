const express = require("express")
const photoRouter = express.Router()
const { photoControllers } = require("../controllers/index")

photoRouter.post("/", photoControllers.postPhoto)

photoRouter.get("/", photoControllers.getPhotos)

photoRouter.get("/", photoControllers.getPhoto)

photoRouter.put("/", photoControllers.putPhoto)

photoRouter.delete("/", photoControllers.deletePhotos)

photoRouter.delete("/", photoControllers.deletePhoto)

module.exports = photoRouter
