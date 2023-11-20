const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  session,
} = require("../common")

const { OK, CREATED, NOT_FOUND, FORBIDDEN } = httpStatusCodes

describe("Captions route", () => {
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
  let loggedInUserId = ""

  let adminSession = ""
  let adminCsrfToken = ""

  before(async function () {
    userSession = session(app)

    await userSession.post("/register").send(userCredentials).expect(CREATED)

    const loginResponse = await userSession
      .post("/login")
      .send(userCredentials)
      .expect(OK)

    csrfToken = JSON.parse(loginResponse.text).csrfToken

    const searched = await models.User.findOne({
      where: { username: userCredentials.username },
    })
    loggedInUserId = searched.dataValues.id

    adminSession = session(app)

    const adminLoginResponse = await adminSession
      .post("/login")
      .set("x-csrf-token", adminCsrfToken)
      .send(adminCredentials)
      .expect(OK)

    adminCsrfToken = JSON.parse(adminLoginResponse.text).csrfToken
  })

  after(async function () {
    await userSession
      .delete("/users/" + userCredentials.username)
      .set("x-csrf-token", csrfToken)
      .send(userCredentials)
      .expect(OK)

    await adminSession
      .post("/logout")
      .set("x-csrf-token", adminCsrfToken)
      .expect(OK)
  })

  describe("Get /", () => {
    it("When the request body input is one of the valid values (userId and photoId) is a user id, then response is all the captions from the respective user", async function () {
      const expected = JSON.stringify([
        {
          id: 4,
          userId: 4,
          photoId: 1,
          text: "yo",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
        {
          id: 5,
          userId: 4,
          photoId: 2,
          text: "yo",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
        {
          id: 6,
          userId: 4,
          photoId: 2,
          text: "That is a good salesboy",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
        {
          id: 7,
          userId: 4,
          photoId: 3,
          text: "yo",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
      ])
      const requestBody = {
        userId: 4,
      }

      const response = await userSession.get("/captions/").send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.strictEqual(response.text, expected)
    })

    it("When the request body input is one of the valid values (userId and photoId) is a photo id, then response is all the captions with of the respective photo", async function () {
      const expected = JSON.stringify([
        {
          id: 2,
          userId: 2,
          photoId: 3,
          text: "Didn't know there was brown penguins!",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 2,
            username: "Carkeys23307",
            isAdmin: false,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
        {
          id: 7,
          userId: 4,
          photoId: 3,
          text: "yo",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
      ])
      const requestBody = {
        photoId: 3,
      }

      const response = await userSession.get("/captions/").send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.strictEqual(response.text, expected)
    })

    it("When there are two valid request body inputs is a user id and photo id, then response is all captions with respective photo and user", async function () {
      const expected = JSON.stringify([
        {
          id: 5,
          userId: 4,
          photoId: 2,
          text: "yo",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
        {
          id: 6,
          userId: 4,
          photoId: 2,
          text: "That is a good salesboy",
          votes: 0,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
          author: {
            id: 4,
            username: "yomaster",
            isAdmin: true,
            createdAt: "2023-11-02T20:00:00.000Z",
            updatedAt: "2023-11-02T20:00:00.000Z",
          },
        },
      ])
      const requestBody = {
        userId: 4,
        photoId: 2,
      }

      const response = await userSession.get("/captions/").send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.strictEqual(response.text, expected)
    })
  })

  describe("Get /:captionId", () => {
    it("When the given caption id does not exist, then response is not found ", async function () {
      const expected = "Not found."
      const captionId = 1000

      const response = await userSession.get("/captions/" + captionId)

      assert.strictEqual(response.status, NOT_FOUND)
      assert.strictEqual(response.text, expected)
    })

    it("When the given caption id does exist, then response is not found ", async function () {
      const expected = JSON.stringify({
        id: 5,
        userId: 4,
        photoId: 2,
        text: "yo",
        votes: 0,
        createdAt: "2023-11-04T20:01:00.000Z",
        updatedAt: "2023-11-04T20:01:00.000Z",
        author: {
          id: 4,
          username: "yomaster",
          isAdmin: true,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      })
      const captionId = 5

      const response = await userSession.get("/captions/" + captionId)

      assert.strictEqual(response.status, OK)
      assert.strictEqual(response.text, expected)
    })
  })

  describe("Post /", () => {
    it("When request body has both required inputs (photoId, and caption text), then a caption is created on the respective photo with the caption text that is made from the logged in user ", async function () {
      const expected = " caption has been created."
      const expectedOne = 1
      const photoId = 1
      const text = "That is really cool art"
      const requestBody = {
        photoId,
        text,
      }

      const response = await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, CREATED)
      assert.include(response.text, expected)

      const deleted = await models.Caption.destroy({
        where: { photoId, text, userId: loggedInUserId },
      })

      assert.strictEqual(deleted, expectedOne)
    })
  })

  describe("Delete /", () => {
    it("When user tries to delete other user's cations, then response is forbidden", async function () {
      const expected = "Forbidden."
      const requestBody = { userId: 1 }

      const response = await userSession
        .delete("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, FORBIDDEN)
      assert.strictEqual(response.text, expected)
    })

    it("When user does not input anything into request body, then all of captions of the logged in user are deleted", async function () {
      const expected = "has deleted all of their own captions associated"
      const requestBody = {}
      const requestBody1 = {
        photoId: 1,
        text: "caption text",
      }
      const requestBody2 = {
        photoId: 1,
        text: "caption text 1",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody2)
        .expect(CREATED)

      const response = await userSession
        .delete("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When user inputs their own user id into the request body, then all of captions of the logged in user are deleted", async function () {
      const expected = "has deleted all of their own captions associated"
      const requestBody = {
        userId: loggedInUserId,
      }
      const requestBody1 = {
        photoId: 1,
        text: "caption text",
      }
      const requestBody2 = {
        photoId: 1,
        text: "caption text 1",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody2)
        .expect(CREATED)

      const response = await userSession
        .delete("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When user inputs a photo id into the request body, then all of captions of the the respective photo owned by the logged in user", async function () {
      const expected = "has deleted all of their own captions associated"
      const photoId = 1
      const requestBody = {
        photoId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)

      const response = await userSession
        .delete("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When an admin inputs a different user's user id into the request body, then all of captions owned by the different user are deleted", async function () {
      const expected = "has deleted all of the captions associated"
      const photoId = 1
      const requestBody = {
        userId: loggedInUserId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      const requestBody2 = {
        photoId: 2,
        text: "caption text 1",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody2)
        .expect(CREATED)

      const response = await adminSession
        .delete("/captions")
        .set("x-csrf-token", adminCsrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When an admin inputs a photo id into the request body, then all of captions owned by the different user are deleted", async function () {
      const expected = "has deleted all of the captions associated"
      const title = "title"
      const filePath = "./public/img/photo-tests/title.jpeg"
      await userSession
        .post("/photos/")
        .set("x-csrf-token", csrfToken)
        .field("title", title)
        .attach("photo", filePath)
        .expect(CREATED)
      const searched = await models.Photo.findOne({
        where: { userId: loggedInUserId },
      })
      const photoId = searched.dataValues.id
      const requestBody = {
        photoId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      const requestBody2 = {
        photoId: 2,
        text: "caption text 1",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody2)
        .expect(CREATED)

      const response = await adminSession
        .delete("/captions")
        .set("x-csrf-token", adminCsrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)

      await adminSession
        .delete("/photos/" + photoId)
        .set("x-csrf-token", adminCsrfToken)
        .expect(OK)
    })

    it("When an admin inputs a different user's user id and photo id into the request body, then all of captions of the respective photo owned by the different user are deleted", async function () {
      const expected = "has deleted all of the captions associated"
      const photoId = 1
      const requestBody = {
        userId: loggedInUserId,
        photoId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)

      const response = await adminSession
        .delete("/captions")
        .set("x-csrf-token", adminCsrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
