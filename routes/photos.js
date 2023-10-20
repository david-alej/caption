const express = require("express")
const photosRouter = express.Router()

const multer = require("multer")
const upload = multer({
  dest: "../public/img/temp/",
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
})

const { photosControllers } = require("../controllers/index")

photosRouter.post("/", upload.single("photo"), photosControllers.postPhoto)

photosRouter.get("/", photosControllers.getPhotos)

photosRouter.get("/", photosControllers.getPhoto)

photosRouter.put("/", photosControllers.putPhoto)

photosRouter.delete("/", photosControllers.deletePhotos)

photosRouter.delete("/", photosControllers.deletePhoto)

module.exports = photosRouter
