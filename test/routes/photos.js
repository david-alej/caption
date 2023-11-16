const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  seedersDirectory,
  session,
} = require("../common")
const {
  seedS3Images,
  deleteAllS3Images,
  deleteFile,
  getObjectData,
} = require("../../util/s3")

// eslint-disable-next-line security/detect-non-literal-require
const usersSeeder = require(seedersDirectory + "/20231027225905-User")
// eslint-disable-next-line security/detect-non-literal-require
const photosSeeder = require(seedersDirectory + "/20231027225911-Photo.js")

const { OK, CREATED, NOT_FOUND, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Photos route", () => {
  const userCredentials = {
    username: "username",
    password: "Password1",
  }
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  let userSession = ""
  let csrfToken = ""

  before(async function () {
    this.timeout(5 * 1000)

    await usersSeeder.up(models.sequelize.getQueryInterface(), null)

    await photosSeeder.up(models.sequelize.getQueryInterface(), null)

    await seedS3Images()

    userSession = session(app)

    await userSession.post("/register").send(userCredentials).expect(CREATED)

    const loginResponse = await userSession
      .post("/login")
      .send(userCredentials)
      .expect(OK)

    csrfToken = JSON.parse(loginResponse.text).csrfToken
  })

  after(async function () {
    this.timeout(4000)

    await deleteAllS3Images()

    await models.User.truncate()

    await models.Photo.truncate()
  })

  describe("Get /", () => {
    it("When valid request is made with no valid request body inputs, then all the top voted photos are returned #attachFilesToResponse", async function () {
      this.timeout(5 * 1000)

      const expected = [
        {
          id: 2,
          userId: 2,
          title: "Sales Consultant",
          filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: null,
        },
        {
          id: 1,
          userId: 1,
          title: "Designer",
          filename: "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: null,
        },
        {
          id: 3,
          userId: 3,
          title: "Me and my siblings",
          filename: "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: null,
        },
      ]

      const response = await userSession.get("/photos/")

      assert.strictEqual(response.status, OK)
      for (let i = 0; i < expected.length; i++) {
        assert.include(response.text, JSON.stringify(expected[parseInt(i)]))
      }
    })

    it("When valid request is made with a user id in the request body, then all the photos are returned for the given username ", async function () {
      this.timeout(5 * 1000)

      const expected = JSON.stringify({
        id: 2,
        userId: 2,
        title: "Sales Consultant",
        filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
        createdAt: "2023-11-04T20:00:00.000Z",
        updatedAt: "2023-11-04T20:00:00.000Z",
      })
      const requestBody = { userId: 2 }

      const response = await userSession.get("/photos/").send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected.substring(0, expected.length - 1))
    })

    it("When valid request is made with a photo title in the request body, then all the photos are returned for the given photo title ", async function () {
      this.timeout(5 * 1000)

      const expected = JSON.stringify({
        id: 3,
        userId: 3,
        title: "Me and my siblings",
        filename: "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
        createdAt: "2023-11-04T20:00:00.000Z",
        updatedAt: "2023-11-04T20:00:00.000Z",
        totalVotes: null,
      })
      const requestBody = { title: "Me and my siblings" }

      const response = await userSession.get("/photos/").send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected.substring(0, expected.length - 1))
    })
  })

  describe("Get /:photoId", () => {
    it("When valid request is made but photoId is not an integer, then response is bad request #integerValidator", async function () {
      const expected = "Bad request."
      const photoId = "five"

      const response = await userSession.get("/photos/" + photoId)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)
    })

    it("When valid request is made but photoId does not exists, then response is not found", async function () {
      const expected = "Not found."
      const photoId = "5"

      const response = await userSession.get("/photos/" + photoId)

      assert.strictEqual(response.status, NOT_FOUND)
      assert.include(response.text, expected)
    })

    it("When valid request and photoId is an integer and exists, then the respective photo sent in a multipart form #attachFilesToResponse", async function () {
      const expected = {
        id: 2,
        userId: 2,
        title: "Sales Consultant",
        filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
        createdAt: "2023-11-04T20:00:00.000Z",
        updatedAt: "2023-11-04T20:00:00.000Z",
        captions: [],
        author: {
          id: 2,
          username: "Carkeys23307",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      }
      const photoId = "2"

      const response = await userSession.get("/photos/" + photoId)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, JSON.stringify(expected))
    })
  })

  describe("Post /", () => {
    it("When a file that is not the allowed image types that are jpg, png, and gif, then response is bad request ", async function () {
      const expected = "Bad request."
      const title = "image"
      const filePath = "./public/img/photo-tests/image.js"

      const response = await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title)
        .attach("photo", filePath)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)
    })

    it("When an allowed image type is uploaded as the file, then photo is created and the url to the photo is attached to the response ", async function () {
      const title = "title"
      const expected = `/photos/${title}`
      const filePath = "./public/img/photo-tests/title.jpeg"

      const response = await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title)
        .attach("photo", filePath)

      assert.strictEqual(response.status, CREATED)
      assert.include(response.text, expected)

      const searched = await models.Photo.findOne({ where: { title } })
      const filename = searched.dataValues.filename
      await deleteFile(filename)
      await models.Photo.destroy({
        where: {
          filename,
        },
      })
    })
  })

  describe("Delete /", () => {
    it("When regular user inputs another user's id to delete photos of another user, then response is forbidden ", async function () {
      const expected = "Forbidden."
      const differentUserIdCredentials = { userId: 1 }

      const response = await userSession
        .delete("/photos/")
        .set("x-csrf-token", csrfToken)
        .send(differentUserIdCredentials)

      assert.strictEqual(response.status, FORBIDDEN)
      assert.include(response.text, expected)
    })

    it("When user does not input anything to request body, then all of photos of the logged in user are deleted ", async function () {
      this.timeout(6 * 1000)

      const title1 = "title"
      const title2 = "World Of Warcraft"
      const filePath1 = "./public/img/photo-tests/title.jpeg"
      const filePath2 = "./public/img/photo-tests/WOW.png"
      const expectedOne = "has deleted all of the"
      const expectedTwo = null
      const userIdCredentials = { userId: 5 }
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title1)
        .attach("photo", filePath1)
        .expect(201)
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title2)
        .attach("photo", filePath2)
        .expect(201)
      const searched = await models.Photo.findAll({ where: userIdCredentials })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const response = await userSession
        .delete("/photos")
        .set("x-csrf-token", csrfToken)
      const s3PhotoOne = await getObjectData(filenames[0])
      const s3PhotoTwo = await getObjectData(filenames[1])

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.strictEqual(s3PhotoOne, expectedTwo)
      assert.strictEqual(s3PhotoTwo, expectedTwo)
    })

    it("When user inputs their own user ids, then all of photos of the logged in user are deleted ", async function () {
      this.timeout(6 * 1000)

      const title1 = "title"
      const title2 = "World Of Warcraft"
      const filePath1 = "./public/img/photo-tests/title.jpeg"
      const filePath2 = "./public/img/photo-tests/WOW.png"
      const expectedOne = "has deleted all of the"
      const expectedTwo = null
      const userIdCredentials = { userId: 5 }
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title1)
        .attach("photo", filePath1)
        .expect(201)
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title2)
        .attach("photo", filePath2)
        .expect(201)
      const searched = await models.Photo.findAll({ where: userIdCredentials })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const response = await userSession
        .delete("/photos")
        .set("x-csrf-token", csrfToken)
        .send(userIdCredentials)
      const s3PhotoOne = await getObjectData(filenames[0])
      const s3PhotoTwo = await getObjectData(filenames[1])

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.strictEqual(s3PhotoOne, expectedTwo)
      assert.strictEqual(s3PhotoTwo, expectedTwo)
    })

    it("When an admin inputs their another user's user id, then all of photos of the choosen user are deleted ", async function () {
      this.timeout(6 * 1000)

      const title1 = "title"
      const title2 = "World Of Warcraft"
      const filePath1 = "./public/img/photo-tests/title.jpeg"
      const filePath2 = "./public/img/photo-tests/WOW.png"
      const expectedOne = "has deleted all of the"
      const expectedTwo = null
      const targetUserIdCredentials = { userId: 5 }
      const adminSession = session(app)
      const adminLoginResponse = await adminSession
        .post("/login")
        .send(adminCredentials)
        .expect(OK)
      const adminCsrfToken = JSON.parse(adminLoginResponse.text).csrfToken
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title1)
        .attach("photo", filePath1)
        .expect(201)
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title2)
        .attach("photo", filePath2)
        .expect(201)
      const searched = await models.Photo.findAll({
        where: targetUserIdCredentials,
      })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const response = await adminSession
        .delete("/photos")
        .set("x-csrf-token", adminCsrfToken)
        .send(targetUserIdCredentials)
      const s3PhotoOne = await getObjectData(filenames[0])
      const s3PhotoTwo = await getObjectData(filenames[1])

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expectedOne)
      assert.strictEqual(s3PhotoOne, expectedTwo)
      assert.strictEqual(s3PhotoTwo, expectedTwo)
    })
  })

  describe("Delete /", () => {
    it(" ", async function () {})
  })
})
