require("dotenv").config()
const fs = require("fs")
const Sequelize = require("sequelize")
const util = require("util")
const uuidv4 = require("uuid").v4
const unlinkFile = util.promisify(fs.unlink)
const { uploadFile, attachFilesToResponse, deleteFile } =
  require("../util/index").s3
const models = require("../database/models")
const { Api400Error, Api401Error, Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors
const { validationPerusal } = require("./validators")

const whereSearch = (whereOption) => {
  return {
    where: whereOption,
    include: [
      {
        model: models.Caption,
        as: "captions",
        include: [
          {
            model: models.User,
            as: "author",
            attributes: { exclude: ["password"] },
            require: true,
          },
        ],
        order: [["votes", "DESC"]],
      },
      {
        model: models.User,
        as: "author",
        attributes: { exclude: ["password"] },
      },
    ],
  }
}

exports.paramPhotoId = async (req, res, next, photoId) => {
  const user = req.session.user

  try {
    const { photoId } = validationPerusal(req, `User: ${user.id}`)

    const searchParams = whereSearch({ id: photoId })

    const searched = await models.Photo.findOne(searchParams)

    if (!searched) {
      throw new Api401Error(
        `User: ${user.id} photos were not found given photo id ${photoId}.`
      )
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
        `User: ${user.id} tried uploading file that was not an image.`
      )
    }

    const sharpInput = [buffer]

    if (["gif"].includes(fileExtension)) {
      sharpInput.push({ animated: true })
    }

    const result = await sharp(...sharpInput)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })

    const created = await models.Photo.create({
      userId: user.userId,
      photoName: fileTitle,
      photoFilename: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await unlinkFile(file.path)

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    console.log(result)

    res.status(201).json({
      imagePath: `/photos/${fileTitle}`,
      msg: `User: ${user.id} has uploaded a photo.`,
    })
  } catch (err) {
    next(err)
  }
}

exports.getPhotos = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`
  const topPhotosSearch = {
    attributes: {
      include: [
        [Sequelize.fn("SUM", Sequelize.col("captions.votes")), "totalVotes"],
      ],
    },
    include: [
      {
        model: models.Caption,
        as: "captions",
        attributes: [],
        include: [
          {
            model: models.User,
            as: "author",
            attributes: { exclude: ["password"] },
            required: true,
          },
        ],
        order: [["votes", "DESC"]],
      },
      {
        model: models.User,
        as: "author",
        attributes: { exclude: ["password"] },
      },
    ],
    group: ["Photo.id"],
    order: [[Sequelize.col("totalVotes"), "DESC"]],
  }
  try {
    const { photoName, username } = validationPerusal(req, preErrorMsg)

    let searchParams = topPhotosSearch

    if (photoName) {
      searchParams = whereSearch(photoName)
    }

    if (username) {
      searchParams = whereSearch(username)
    }

    const searched = await models.Photo.findAll(searchParams)

    if (!searched) {
      throw new Api401Error(`User: ${user.id} photos were not found.`)
    }

    const photos = searched.dataValues

    attachFilesToResponse(res, photos)
  } catch (err) {
    next(err)
  }
}

exports.getPhoto = async (req, res, next) => {
  const photo = req.photo

  try {
    attachFilesToResponse(res, photo)
  } catch (err) {
    next(err)
  }
}

exports.putPhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user

  try {
    if (photo.userId !== user.id) {
      throw new Api403Error(
        `User: ${user.id} cannot update a photo that does not belong to them.`
      )
    }

    const updatedValues = { photoName: photo.photoName, updatedAt: new Date() }

    const updated = await models.Photo.update(updatedValues, {
      where: { id: photo.id },
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${user.id} update photo name query did not work.`
      )
    }
    res
      .status(204)
      .send(`User: ${user.id} has updated one of their photos name.`)
  } catch (err) {
    next(err)
  }
}

exports.deletePhotos = async (req, res, next) => {
  const preErrorMsg = `User: ${user.id}`
  const user = req.session.user
  const targetUsername = req.body.username
  const targetUserId = req.body.userId
  const targetIsSelf =
    user.username === targetUsername || user.id === targetUserId
  const whereOption = targetUsername
    ? { username: targetUsername }
    : { userId: targetUserId }
  const afterMessage = targetUsername
    ? `username ${targetUsername}.`
    : `id ${targetUserId}.`
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted all of their own photos.`
    : `User: ${user.id} has deleted all of the photos of a user with ` +
      afterMessage

  try {
    if (!targetIsSelf || !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete photos that does not belong to them.`
      )
    }

    await validationPerusal(req, preErrorMsg)

    const deleted = await models.Photo.destroy({
      where: whereOption,
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photos query did not work given a user with .`
      )
    }

    const { photoFilename } = deleted.dataValues

    await deleteFile(photoFilename)

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}

exports.deletePhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  const responseMsg = user.isAdmin
    ? `User: ${user.id} has deleted one of user id ${photos.userId} photos.`
    : `User: ${user.id} has deleted one of their own photos.`

  try {
    if (photo.userId !== user.id || !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete a photo that does not belong to them.`
      )
    }

    const deleted = await models.Photo.destroy({
      where: { id: photo.id },
    })

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photo with photo id query did not work.`
      )
    }

    const { photoFilename } = deleted.dataValues

    await deleteFile(photoFilename)

    res.status(204).send(responseMsg)
  } catch (err) {
    next(err)
  }
}
