require("dotenv").config()
const fs = require("fs")
const util = require("util")
const uuidv4 = require("uuid").v4
const unlinkFile = util.promisify(fs.unlink)
const { uploadFile, getFileStream } = require("../util/index").s3
const models = require("../database/models")
const { Api400Error, Api500Error } = require("../util/index").apiErrors

exports.postPhoto = async (req, res, next) => {
  const user = req.session.user
  const file = req.file
  const fileTitle = req.body.title
  const filename = uuidv4() + ".webp"
  const { buffer, originalname, mimetype } = file
  const fileExtension = originalname.slice(
    ((originalname.lastIndexOf(".") - 1) >>> 0) + 2
  )
  console.log(file)

  const allowedFiles = ["png", "jpeg", "jpg", "gif"]
  const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"]

  try {
    if (
      !allowedFiles.includes(fileExtension) ||
      !allowedFileTypes.includes(mimetype)
    ) {
      throw new Api400Error(
        `User with username: ${user.username} tried uploading file that was not an image.`
      )
    }

    const result = await sharp(buffer)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })

    await unlinkFile(file.path)

    const created = await models.Photo.create({
      userId: user.userId,
      photoName: fileTitle,
      photoFilename: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!created) {
      throw new Api500Error(`User: ${user.username} update query did not work.`)
    }

    console.log(result)

    res.status(201).json({
      imagePath: `/photos/${fileTitle}`,
      msg: `User: ${user.username} has uploaded a photo.`,
    })
  } catch (err) {
    next(err)
  }
}

exports.getPhotos = async (req, res, next) => {}

exports.getPhoto = async (req, res, next) => {}

exports.putPhoto = async (req, res, next) => {}

exports.deletePhotos = async (req, res, next) => {}

exports.deletePhoto = async (req, res, next) => {}
