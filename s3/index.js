/* eslint-disable security/detect-non-literal-fs-filename */
require("dotenv").config()
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const FormData = require("form-data")
const util = require("util")
const { pipeline } = require("stream/promises")
const unlinkFile = util.promisify(fs.unlink)

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const uploadFile = async (buffer, filename) => {
  const uploadParams = {
    Bucket: bucketName,
    Body: buffer,
    Key: filename,
  }

  const command = new PutObjectCommand(uploadParams)

  await client.send(command)
}

exports.uploadFile = uploadFile

function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  const command = new GetObjectCommand(downloadParams)

  return client.send(command)
}

exports.getFileStream = getFileStream

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

const getAllObjectKeys = async () => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
  })

  try {
    let isTruncated = true
    let keys = []

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await client.send(command)

      if (Contents) {
        Contents.map((c) => keys.push(c.Key))
      }

      isTruncated = IsTruncated

      command.input.ContinuationToken = NextContinuationToken
    }

    return keys
  } catch (err) {
    console.error(err)

    return null
  }
}

exports.getAllObjectKeys = getAllObjectKeys

const attachFilesToResponse = async (res, photos) => {
  const maxWidth = 750,
    maxHeight = 750

  const form = new FormData()

  for (let i = 0; i < photos.length; i++) {
    const { filename, title } = photos[parseInt(i)]
    const filePath = path.join("./public/img/temp", filename)

    fs.writeFileSync(filePath, "")

    const file = fs.createWriteStream(filePath)
    const response = await getFileStream(filename)

    await pipeline(response.Body, file)

    const buffer = fs.readFileSync(filePath, { encoding: "" })

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

  form.pipe(res)
}

exports.attachFilesToResponse = attachFilesToResponse

const deleteFile = (fileKey) => {
  const deleteParams = {
    Key: fileKey,
    Bucket: bucketName,
  }

  const command = new DeleteObjectCommand(deleteParams)

  return client.send(command)
}

exports.deleteFile = deleteFile

const seedS3Images = async () => {
  const baseDirectory = "./public/img/seeds"

  const files = await fs.promises.readdir(baseDirectory)

  for (const filename of files) {
    const data = await getObjectData(filename)

    if (data) {
      console.log(filename, "exists already in S3.")
      continue
    }
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
  }
}

exports.seedS3Images = seedS3Images

const deleteAllS3Images = async () => {
  const filenames = await getAllObjectKeys()

  for (const filename of filenames) {
    await deleteFile(filename)
  }
}

exports.deleteAllS3Images = deleteAllS3Images
