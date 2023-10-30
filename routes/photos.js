const express = require("express")
const photosRouter = express.Router()
const {
  uuidValidator,
  textValidator,
  getPhotosValidator,
  deletePhotosValidator,
} = require("../controllers/index").validators
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
  "photoId",
  uuidValidator("photoId", true),
  photosControllers.paramPhotoId
)

photosRouter.post("/", upload.single("photo"), photosControllers.postPhoto)

photosRouter.get("/", getPhotosValidator, photosControllers.getPhotos)

photosRouter.get("/:photoId", photosControllers.getPhoto)

photosRouter.put(
  "/:photoId",
  textValidator("photoName"),
  photosControllers.putPhoto
)

photosRouter.delete("/", deletePhotosValidator, photosControllers.deletePhotos)

photosRouter.delete("/:photoId", photosControllers.deletePhoto)

module.exports = photosRouter
