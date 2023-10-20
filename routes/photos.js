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

photosRouter.param("photoName", photosControllers.paramPhotoName)

photosRouter.post("/", upload.single("photo"), photosControllers.postPhoto)

photosRouter.get("/", photosControllers.getPhotos)

photosRouter.get("/:photoName", photosControllers.getPhoto)

photosRouter.put("/:photoName", photosControllers.putPhoto)

photosRouter.delete("/", photosControllers.deletePhotos)

photosRouter.delete("/:photoname", photosControllers.deletePhoto)

module.exports = photosRouter
