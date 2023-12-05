/* eslint-disable security/detect-non-literal-fs-filename */
const { expect, faker, httpMocks, httpStatusCodes, s3 } = require("../common")

const { OK, NO_CONTENT } = httpStatusCodes

const { createResponse } = httpMocks

const fs = require("fs")
const path = require("path")

describe.only("AWS-SDK S3 client", function () {
  const seededImagesFilenames = [
    "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
    "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
    "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
  ]
  let filename

  describe("s3.getFileStream", function () {
    it("When no input is given, Then key not found erro is thrown", async function () {
      try {
        await s3.getFileStream()
      } catch (err) {
        expect(err.message).to.equal(
          "No value provided for input HTTP label: Key."
        )
      }
    })

    it("When non-existing object key is given, Then key not found erro is thrown", async function () {
      const key = faker.string.uuid() + ".jpg"

      try {
        await s3.getFileStream(key)
      } catch (err) {
        expect(err.message).to.equal("The specified key does not exist.")
      }
    })

    it("When existing object key is given, Then response is the image buffer", async function () {
      const key =
        seededImagesFilenames[
          Math.floor(Math.random() * seededImagesFilenames.length)
        ]

      const { Body } = await s3.getFileStream(key)

      expect(Body).to.exist
    })
  })

  describe("s3.getObjectData", function () {
    it("When no input is given, Then key not found erro is thrown", async function () {
      try {
        await s3.getObjectData()
      } catch (err) {
        expect(err.message).to.equal("The specified key does not exist.")
      }
    })

    it("When non-existing object key is given, Then the return is null ", async function () {
      const fakeKey = faker.string.uuid() + ".jpg"

      const objectData = await s3.getObjectData(fakeKey)

      expect(objectData).to.equal(null)
    })

    it("When existing object key is given, Then the return is buffer as a string ", async function () {
      const key = seededImagesFilenames[Math.floor(Math.random() * 3)]

      const objectData = await s3.getObjectData(key)

      expect(objectData).to.be.a("string")
    })
  })

  describe("s3.getAllObjectKeys", function () {
    it("When function is called, Then all the object keys in the s3 bucket are returned", async function () {
      const keys = await s3.getAllObjectKeys()

      expect(keys).to.have.all.members(seededImagesFilenames)
    })
  })

  describe("s3.uploadFile", function () {
    it("When no input is given, Then key not found err is thrown", async function () {
      try {
        await s3.uploadFile()
      } catch (err) {
        expect(err.message).to.equal(
          "No value provided for input HTTP label: Key."
        )
      }
    })

    it("When buffer input is not a datatype with a length property, Then response is a message", async function () {
      const key = faker.string.uuid() + ".jpg"
      const buffer = new Date()
      const SERVICE_UNAVAILABLE = 501

      try {
        await s3.uploadFile(buffer, key)
      } catch (err) {
        expect(err.$metadata.httpStatusCode).to.equal(SERVICE_UNAVAILABLE)
      }
    })

    it("When valid buffer with newly made key, Then response is ok", async function () {
      const key = faker.string.uuid() + ".jpg"
      const filePath = path.join("./public/img/s3-tests", "mage.jpg")
      const buffer = fs.readFileSync(filePath, { encoding: "" })

      const {
        $metadata: { httpStatusCode },
      } = await s3.uploadFile(buffer, key)

      expect(httpStatusCode).to.equal(OK)

      filename = key
    })
  })

  describe("s3.attachFileToResponse", function () {
    let res

    beforeEach(function () {
      res = createResponse({
        eventEmitter: require("events").EventEmitter,
      })
    })

    it("When a replica of express response is given and an array of photo objects is given, Then the headers for the express response is ammended", async function () {
      this.timeout(10 * 1000)
      const photos = [
        { filename, title: "randomImage" },
        { filename, title: "random image two" },
      ]

      await s3.attachFilesToResponse(res, photos)

      expect(res._headers["x-content-type"]).to.include(
        "multipart/form-data; boundary=--------------------------"
      )
      expect(res._headers["content-type"]).to.equal("text/plain")
    })
  })

  describe("s3.deleteFile", function () {
    it("When no input is given, Then key not found erro is thrown", async function () {
      try {
        await s3.deleteFile()
      } catch (err) {
        expect(err.message).to.equal(
          "No value provided for input HTTP label: Key."
        )
      }
    })

    it("When when a key that is a empty datatype is given, Then repsonse is ", async function () {
      const fakeKey = ""
      try {
        await s3.deleteFile(fakeKey)
      } catch (err) {
        expect(err.message).to.equal(
          "Empty value provided for input HTTP label: Key."
        )
      }
    })

    it("When when a fake key is given, Then repsonse is no-content", async function () {
      const fakeKey = faker.string.uuid() + ".jpg"

      const { httpStatusCode } = await s3.deleteFile(fakeKey)

      expect(httpStatusCode).to.equal(NO_CONTENT)
    })

    it("When valid object is provided, Then respective object is deleted and response prperty for httpStatusCode is no content", async function () {
      const response = await s3.deleteFile(filename)

      expect(response.httpStatusCode).to.equal(NO_CONTENT)

      await s3.deleteFile(filename)
    })
  })

  describe("s3.deleteAllS3Images", function () {
    it("When function is called, Then all images on the s3 bucker are deleted", async function () {
      const deletedImages = await s3.deleteAllS3Images()

      expect(deletedImages).to.eql(seededImagesFilenames)
    })
  })

  describe("s3.seedS3Images", function () {
    it("When seed images are not present on the s3 bucket, Then response is an array of the seeded images to the s3 bucket ", async function () {
      const imagesUploaded = await s3.seedS3Images()

      expect(imagesUploaded).to.eql(seededImagesFilenames)
    })

    it("When images are seeded when they are already exist on the s3 bucket, Then response is an empty array ", async function () {
      const imagesUploaded = await s3.seedS3Images()

      expect(imagesUploaded).to.eql([])
    })
  })
})
