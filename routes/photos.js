const express = require("express")
const photosRouter = express.Router()
const { photosControllers } = require("../controllers/index")

photosRouter.post("/", photosControllers.postPhoto)

photosRouter.get("/", photosControllers.getPhotos)

photosRouter.get("/", photosControllers.getPhoto)

photosRouter.put("/", photosControllers.putPhoto)

photosRouter.delete("/", photosControllers.deletePhotos)

photosRouter.delete("/", photosControllers.deletePhoto)

module.exports = photosRouter
