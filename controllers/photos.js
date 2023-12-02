require("dotenv").config()
const sharp = require("sharp")
const uuidv4 = require("uuid").v4
const { uploadFile, attachFilesToResponse, deleteFile } = require("../s3/index")
const models = require("../database/models")
const { Api400Error, Api401Error, Api403Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors
const { selfSearch, whereSearch, inputsToSearch } =
  require("../util/index").search
const { validationPerusal, integerValidator } = require("./validators")

const otherOptions = {
  include: [
    {
      model: models.Caption,
      as: "captions",
      include: [
        {
          model: models.User,
          as: "author",
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["votes", "DESC"]],
      limit: 10,
    },
    {
      model: models.User,
      as: "author",
      attributes: { exclude: ["password"] },
    },
  ],
}

const topPhotosSearch = {
  attributes: {
    include: [
      [
        models.Sequelize.literal(
          // eslint-disable-next-line quotes
          '(SELECT SUM("votes") FROM "Captions" WHERE "photoId" = "Photo"."id")'
        ),
        "totalVotes",
      ],
    ],
  },
  include: [
    {
      model: models.Caption,
      as: "captions",
      attributes: [],
    },
  ],
  group: ["Photo.id"],
  order: [[models.Sequelize.col("totalVotes"), "DESC"]],
  limit: 10,
}

exports.paramPhotoId = async (req, res, next, photoId) => {
  const user = req.session.user

  try {
    await integerValidator("photoId", true).run(req)

    validationPerusal(req, `User: ${user.id}`)

    const searchParams = whereSearch({ id: photoId }, otherOptions)

    const searched = await models.Photo.findOne(searchParams)

    if (!searched) {
      throw new Api404Error(
        `User: ${user.id} photo was not found given photo id ${photoId}.`
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
  const preErrorMsg = `User: ${user.id}`
  const { buffer, originalname, mimetype } = file
  const filename = uuidv4() + ".webp"

  const allowedFiles = ["png", "jpeg", "jpg", "gif"]
  const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"]

  try {
    validationPerusal(req, preErrorMsg)

    const title = req.body.title
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

    await sharp(...sharpInput)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        await uploadFile(resized, filename)
      })

    const created = await models.Photo.create({
      userId: user.id,
      title,
      filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    res.status(201).json({
      imagePath: `/photos/${title}`,
      msg: `User: ${user.id} has uploaded a photo.`,
    })
  } catch (err) {
    next(err)
  }
}

exports.getPhotos = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`

  try {
    validationPerusal(req, preErrorMsg)

    const { afterMsg, searchParams } = inputsToSearch(
      req,
      topPhotosSearch,
      otherOptions
    )

    const searched = await models.Photo.findAll(searchParams)

    if (!searched) {
      throw new Api401Error(`User: ${user.id} photos were not found` + afterMsg)
    }

    const photos = searched.map((photo) => photo.dataValues)

    await attachFilesToResponse(res, photos)
  } catch (err) {
    next(err)
  }
}

exports.getPhoto = async (req, res, next) => {
  const photo = req.photo

  try {
    await attachFilesToResponse(res, [photo])
  } catch (err) {
    next(err)
  }
}

exports.putPhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  const { title } = req.body

  try {
    if (photo.userId !== user.id) {
      throw new Api403Error(
        `User: ${user.id} cannot update a photo that does not belong to them.`
      )
    }

    const updatedValues = { title, updatedAt: new Date() }

    const updated = await models.Photo.update(updatedValues, {
      where: { id: photo.id },
    })

    if (!updated) {
      throw new Api500Error(
        `User: ${user.id} update photo name query did not work.`
      )
    }

    res.send(
      `User: ${user.id} has updated one of their photo with id ${photo.id}.`
    )
  } catch (err) {
    next(err)
  }
}

exports.deletePhotos = async (req, res, next) => {
  const user = req.session.user
  const preErrorMsg = `User: ${user.id}`
  let targetIsSelf =
    req.body.userId === undefined ? true : user.id === req.body.userId
  const responseMsg = targetIsSelf
    ? `User: ${user.id} has deleted all of their own photos associated`
    : `User: ${user.id} has deleted all of the photos of a user associated`

  try {
    if (!targetIsSelf && !user.isAdmin) {
      throw new Api403Error(
        `User: ${user.id} cannot delete photos that does not belong to them.`
      )
    }

    validationPerusal(req, preErrorMsg)

    const { afterMsg, searchParams } = inputsToSearch(
      req,
      selfSearch(user.id),
      {}
    )

    const searched = await models.Photo.findAll(searchParams)

    const filenames = searched.map((photo) => {
      return photo.dataValues.filename
    })

    for (let i = 0; i < filenames.length; i++) {
      await deleteFile(filenames[parseInt(i)])
    }

    const deleted = await models.Photo.destroy(searchParams)

    if (!deleted) {
      throw new Api500Error(
        `User: ${user.id} delete photos query did not work given a user ` +
          afterMsg
      )
    }

    res.send(responseMsg + afterMsg)
  } catch (err) {
    next(err)
  }
}

exports.deletePhoto = async (req, res, next) => {
  const photo = req.photo
  const user = req.session.user
  const responseMsg = user.isAdmin
    ? `User: ${user.id} has deleted one of user id ${photo.userId} photos.`
    : `User: ${user.id} has deleted one of their own photos.`

  try {
    if (photo.userId !== user.id && !user.isAdmin) {
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

    await deleteFile(photo.filename)

    res.send(responseMsg)
  } catch (err) {
    next(err)
  }
}
