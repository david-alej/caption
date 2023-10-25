const express = require("express")
const photosRouter = express.Router()
const { paramIntegerValidator, paramTextValidator } =
  require("../controllers/index").validators
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
  paramTextValidator("photoName"),
  photosControllers.paramPhotoName
)

photosRouter.param(
  "photoId",
  paramIntegerValidator("photoId"),
  photosControllers.paramPhotoId
)

photosRouter.post("/", upload.single("photo"), photosControllers.postPhoto)

photosRouter.get("/", photosControllers.getTopPhotos)

photosRouter.get("/:photoName", photosControllers.getPhotos)

photosRouter.put("/:photoId", photosControllers.putPhoto)

photosRouter.delete("/:photoId", photosControllers.deletePhoto)

photosRouter.use("/users", userPhotosRouter)

module.exports = photosRouter
