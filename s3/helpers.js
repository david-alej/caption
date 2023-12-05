/* eslint-disable security/detect-non-literal-fs-filename */
const {
  getFileStream,
  getAllObjectKeys,
  uploadFile,
  deleteFile,
} = require("./crud")

const fs = require("node:fs")
const path = require("node:path")
const util = require("node:util")
const { pipeline } = require("node:stream/promises")
const sharp = require("sharp")
const FormData = require("form-data")
const unlinkFile = util.promisify(fs.unlink)

const getObjectData = async (fileKey) => {
  try {
    const response = await getFileStream(fileKey)

    const str = await response.Body.transformToString()

    return str
  } catch (err) {
    return null
  }
}

exports.getObjectData = getObjectData

const attachFilesToResponse = async (res, photos) => {
  const maxWidth = 750,
    maxHeight = 750

  const form = new FormData()

  for (let i = 0; i < photos.length; i++) {
    const { filename, title } = photos[parseInt(i)]

    const { Body } = await getFileStream(filename)

    const filePath = path.join("./public/img/temp", filename)

    await pipeline(Body, fs.createWriteStream(filePath))

    const buffer = await fs.promises.readFile(filePath, { encoding: "" })

    await sharp(buffer)
      .resize(maxWidth, maxHeight)
      .webp({ lossless: true })
      .toBuffer()
      .then((resized) => {
        form.append(title, resized, filename)
        form.append(
          title + " - information",
          JSON.stringify(photos[parseInt(i)])
        )
      })

    await unlinkFile(filePath)
  }

  res.setHeader(
    "X-Content-Type",
    "multipart/form-data; boundary=" + form._boundary
  )

  res.setHeader("Content-Type", "text/plain")

  await form.pipe(res)
}

exports.attachFilesToResponse = attachFilesToResponse

const seedS3Images = async () => {
  const baseDirectory = "./public/img/seeds"

  const files = await fs.promises.readdir(baseDirectory)

  const imagesUploaded = []

  for (const filename of files) {
    const data = await getObjectData(filename)

    if (data) {
      console.log(filename, "exists already in S3.")
      continue
    }

    imagesUploaded.push(filename)

    const filePath = path.join(baseDirectory, filename)

    const fileExtension = filename.slice(
      ((filename.lastIndexOf(".") - 1) >>> 0) + 2
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const buffer = await fs.readFileSync(filePath)

    const sharpInput = [buffer]

    if (["gif"].includes(fileExtension)) {
      sharpInput.push({ animated: true })
    }

    await sharp(...sharpInput)
      .resize({ width: 150 })
      .webp({ lossless: true })
      .toBuffer()
      .then(async (resized) => {
        uploadFile(resized, filename)
      })

    console.log(filename + " is seeded into the S3 bucket.")
  }

  return imagesUploaded
}

exports.seedS3Images = seedS3Images

const deleteAllS3Images = async () => {
  let imagesDeleted = []

  const filenames = await getAllObjectKeys()

  for (const filename of filenames) {
    await deleteFile(filename)

    imagesDeleted.push(filename)

    console.log(filename + " is deleted from the S3 bucket.")
  }

  return imagesDeleted
}

exports.deleteAllS3Images = deleteAllS3Images
