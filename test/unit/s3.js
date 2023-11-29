const { expect, faker, s3 } = require("../common")

describe("AWS-SDK S3 client", function () {
  const seededImagesFilenames = [
    "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
    "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
    "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
  ]

  describe("s3.getFileStream", function () {
    it("When non-existing object key is given, Then all the object keys in the s3 bucket are returned", async function () {
      const key = faker.string.uuid() + ".jpg"

      try {
        await s3.getFileStream(key)
      } catch (err) {
        console.log(err.message)
        expect(err).to.be.instanceOf(Error)
        expect(err.message).to.equal("The specified key does not exist.")
      }
    })
  })

  describe("s3.getObjectData", function () {
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
})
