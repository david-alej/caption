const express = require("express")
const photosRouter = express.Router()
const { photoNameValidator } = require("../controllers/index").validators
const { photosControllers } = require("../controllers/index")

const multer = require("multer")
const upload = multer({
  dest: "../public/img/temp/",
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
})

photosRouter.param(
  "photoName",
  photoNameValidator,
  photosControllers.paramPhotoName
)

photosRouter.param(
  "username",
  usernameameValidator,
  photosControllers.paramUsername
)

photosRouter.post("/", upload.single("photo"), photosControllers.postPhoto)

photosRouter.get("/", photosControllers.getTopPhotos)

photosRouter.get("/:photoName", photosControllers.getPhotos)

photosRouter.get("/user/:username", photosControllers.getUserPhotos)

photosRouter.put("/:photoName", photosControllers.putPhoto)

photosRouter.delete("/", photosControllers.deletePhotos)

photosRouter.delete("/:photoname", photosControllers.deletePhoto)

module.exports = photosRouter
