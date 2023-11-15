const {
  app,
  assert,
  describe,
  fs,
  httpStatusCodes,
  models,
  seedersDirectory,
  session,
} = require("../common")
const {
  getObjectData,
  seedS3Images,
  deleteAllS3Images,
} = require("../../util/s3")

// eslint-disable-next-line security/detect-non-literal-require
const usersSeeder = require(seedersDirectory + "/20231027225905-User")
// eslint-disable-next-line security/detect-non-literal-require
const photosSeeder = require(seedersDirectory + "/20231027225911-Photo.js")

const { OK, CREATED, NOT_FOUND, BAD_REQUEST } = httpStatusCodes

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
    this.timeout(4000)

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

  // after(async function () {
  //   this.timeout(4000)

  //   await deleteAllS3Images()

  //   await models.User.destroy({ truncate: true })

  //   await models.Photo.destroy({ truncate: true })
  // })

  describe("Get /", () => {
    it("When valid request is made, then all the photos are returned #attachFilesToResponse", async function () {
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

      const response = await userSession
        .get("/photos/")
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, OK)
      for (let i = 0; i < expected.length; i++) {
        assert.include(response.text, JSON.stringify(expected[parseInt(i)]))
      }
    })
  })

  describe("Get /:photoId", () => {
    it("When valid request is made but photoId is not an integer, then response is bad request #integerValidator", async function () {
      const expected = "Bad request."
      const photoId = "five"

      const response = await userSession
        .get("/photos/" + photoId)
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)
    })

    it("When valid request is made but photoId does not exists, then response is not found", async function () {
      const expected = "Not found."
      const photoId = "5"

      const response = await userSession
        .get("/photos/" + photoId)
        .set("x-csrf-token", csrfToken)

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

      const response = await userSession
        .get("/photos/" + photoId)
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, JSON.stringify(expected))
    })
  })

  describe("Post /", () => {
    it("When , then ", async function () {
      const expected = []
      const title = "title"
      const filename = "use get request"
      const buffer = getObjectData(filename)

      const response = await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
      // .field("title", title)
      // .attach("photo", "./public/img/photo-tests/title.jpeg")

      assert.strictEqual(response.status, CREATED)
      assert.include(response.text, expected)
    })
  })
})
