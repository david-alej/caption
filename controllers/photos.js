require("dotenv").config()
const fs = require("fs")
const util = require("util")
const uuidv4 = require("uuid").v4
const unlinkFile = util.promisify(fs.unlink)
const { uploadFile, getFileStream } = require("../util/index").s3
const models = require("../database/models")
const { validationCheck } = require("./validators")
const { Api400Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramPhotoName = async (req, res, next, photoName) => {
  const user = req.session.user
  try {
    const searched = await models.Photo.findOne({
      where: { photoName: photoName },
      include: [
        {
          model: models.Caption,
          as: "captions",
          order: [["votes", "DESC"]],
          include: [
            {
              model: models.User,
              as: "author",
              attributes: { exclude: ["password"] },
            },
          ],
        },
        {
          model: models.User,
          as: "author",
          attributes: { exclude: ["password"] },
        },
      ],
    })

    if (!searched) {
      throw new Api404Error(`User: ${username} photo was not found.`)
    }

    req.photo = searched.dataValues
    next()
  } catch (err) {
    next(err)
  }
}

exports.postPhoto = async (req, res, next) => {
  const user = req.session.user
  const file = req.file
  const fileTitle = req.body.title
  const filename = uuidv4() + ".webp"

  console.log(file)

  const allowedFiles = ["png", "jpeg", "jpg", "gif"]
  const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"]

  try {
    const { buffer, originalname, mimetype } = file
    const fileExtension = originalname.slice(
      ((originalname.lastIndexOf(".") - 1) >>> 0) + 2
    )
    if (
      !allowedFiles.includes(fileExtension) ||
      !allowedFileTypes.includes(mimetype)
    ) {
      throw new Api400Error(
        `User with username: ${user.username} tried uploading file that was not an image.`
      )
    }

    const obj = {}

    if (["gif"].includes(fileExtension)) {
      obj.animated = true
    }

    const result = await sharp(buffer, obj)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })

    const deleteFileLocally = unlinkFile(file.path)

    const created = models.Photo.create({
      userId: user.userId,
      photoName: fileTitle,
      photoFilename: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!(await created)) {
      throw new Api500Error(`User: ${user.username} update query did not work.`)
    }

    console.log(result)

    await deleteFileLocally

    res.status(201).json({
      imagePath: `/photos/${fileTitle}`,
      msg: `User: ${user.username} has uploaded a photo.`,
    })
  } catch (err) {
    next(err)
  }
}

exports.getPhotos = async (req, res, next) => {}

exports.getPhoto = async (req, res, next) => {
  const photo = req.photo
  try {
    const { photoFilename } = photo
    const readStream = getFileStream(photoFilename)

    readStream.pipe(res)

    res.json(photo)
  } catch (err) {
    next(err)
  }
}

exports.putPhoto = async (req, res, next) => {
  const photo = req.photo
  try {
    const { photoName } = validationCheck(req)

    const updatedValues = { photoName, updatedAt: new Date() }

    const updated = await models.Photo.update(updatedValues, {
      where: photo.id,
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${username} update photo name query did not work.`
      )
    }
    res
      .status(204)
      .send(`User: ${username} has updated one of their photos name.`)
  } catch (err) {
    next(err)
  }
}

exports.deletePhotos = async (req, res, next) => {}

exports.deletePhoto = async (req, res, next) => {
  const photo = req.photo
  try {
    const { photoName } = validationCheck(req)

    const updatedValues = { photoName, updatedAt: new Date() }

    const updated = await models.Photo.update(updatedValues, {
      where: photo.id,
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${username} update photo name query did not work.`
      )
    }
    res
      .status(204)
      .send(`User: ${username} has updated one of their photos name.`)
  } catch (err) {
    next(err)
  }
}
