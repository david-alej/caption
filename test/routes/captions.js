const {
  app,
  assert,
  server,
  session,
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  httpStatusCodes,
  models,
  generatePassword,
  generateUsername,
  s3,
} = require("../common")

const { OK, CREATED, NOT_FOUND, FORBIDDEN } = httpStatusCodes

describe("Captions route", function () {
  const userCredentials = {}
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  let client
  let setHeaders = { headers: {} }
  let adminSetHeaders = { headers: {} }
  let loggedInUserId

  before(async function () {
    userCredentials.username = generateUsername()
    userCredentials.password = generatePassword()

    const apiConnection = await initializeWebServer()

    axiosConfig.baseURL += apiConnection.port

    client = axios.create(axiosConfig)

    const { status } = await client.post("/register", userCredentials)

    const {
      status: status1,
      data,
      headers,
    } = await client.post("/login", userCredentials)

    setHeaders.headers.Cookie = headers["set-cookie"]
    setHeaders.headers["x-csrf-token"] = data.csrfToken

    const { data: user } = await client.get(
      "/users/" + userCredentials.username,
      setHeaders
    )

    loggedInUserId = user.id

    const {
      status: status2,
      data: data1,
      headers: headers1,
    } = await client.post("/login", adminCredentials)

    adminSetHeaders.headers.Cookie = headers1["set-cookie"]
    adminSetHeaders.headers["x-csrf-token"] = data1.csrfToken

    expect(status).to.equal(CREATED)
    expect(status1).to.equal(OK)
    expect(status2).to.equal(OK)
  })

  after(async function () {
    const usernameSearch = userCredentials.username
    setHeaders.data = userCredentials

    const { status } = await client.delete(
      "/users/" + usernameSearch,
      setHeaders
    )

    await stopWebServer()

    expect(status).to.equal(OK)
  })

  const captionSchema = {
    title: "Captions schema",
    type: "array",
    items: {
      type: "object",
      required: [
        "id",
        "userId",
        "photoId",
        "text",
        "votes",
        "createdAt",
        "updatedAt",
        "author",
      ],
      properties: {
        author: {
          type: "object",
          required: ["username"],
        },
      },
    },
  }

  describe("Get /", function () {
    it("When the request body input is one of the valid values (userId and photoId) is a user id, then response is all the captions from the respective user", async function () {
      const expected = [
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
      ]
      const requestBody = {
        userId: 4,
      }
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.get("/captions/", config)

      expect(status).to.equal(OK)
      expect(data).to.be.jsonSchema(captionSchema)
      for (let i = 0; i < expected.length; i++) {
        const expectedObject = expected[parseInt(i)]
        expect(data).to.deep.include(expectedObject)
      }
    })

    it("When the request body input is one of the valid values (userId and photoId) is a photo id, then response is all the captions with of the respective photo", async function () {
      const expected = [
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
      ]
      const requestBody = {
        photoId: 3,
      }
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.get("/captions/", config)

      expect(status).to.equal(OK)
      for (let i = 0; i < expected.length; i++) {
        const expectedObject = expected[parseInt(i)]
        expect(data).to.deep.include(expectedObject)
      }
    })

    it("When there are two valid request body inputs is a user id and photo id, then response is all captions with respective photo and user", async function () {
      const expected = [
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
      ]
      const requestBody = {
        userId: 4,
        photoId: 2,
      }
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.get("/captions/", config)

      expect(status).to.equal(OK)
      for (let i = 0; i < expected.length; i++) {
        const expectedObject = expected[parseInt(i)]
        expect(data).to.deep.include(expectedObject)
      }
    })
  })

  describe("Get /:captionId", function () {
    it("When the given caption id does not exist, then response is not found ", async function () {
      const expected = "Not found."
      const captionId = 1000

      const { status, data } = await client.get(
        "/captions/" + captionId,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal(expected)
    })

    it("When the given caption id does exist, then response the respective caption ", async function () {
      const expected = {
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
      }
      const captionId = 5

      const { status, data } = await client.get(
        "/captions/" + captionId,
        setHeaders
      )

      expect(status).to.equal(OK)
      expect(data).to.deep.include(expected)
    })
  })

  describe.only("Post /", function () {
    it("When request body has both required inputs (photoId, and caption text), then a caption is created on the respective photo with the caption text that is made from the logged in user ", async function () {
      const expected = " caption has been created."
      const expectedOne = 1
      const photoId = 1
      const text = "That is really cool art"
      const requestBody = {
        photoId,
        text,
      }
      const config = JSON.parse(JSON.stringify(setHeaders))

      const { status, data } = await client.post(
        "/captions",
        requestBody,
        config
      )

      const deleted = await models.Caption.destroy({
        where: { photoId, text, userId: loggedInUserId },
      })

      expect(status).to.equal(CREATED)
      expect(data).to.include(expected)
      expect(deleted).to.equal(expectedOne)
    })
  })

  describe("Delete /", function () {
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

  describe("Delete /:captionId", function () {
    it("When user tries to delete other user's caption, then response is forbidden", async function () {
      const expected = "Forbidden."
      const captionId = 5

      const response = await userSession
        .delete("/captions/" + captionId)
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, FORBIDDEN)
      assert.strictEqual(response.text, expected)
    })

    it("When user tries to delete one of their caption's given a caption id, then respective caption is deleted", async function () {
      const expected = "has deleted one of their own captions."
      const photoId = 1
      const text = "That is really cool art"
      const requestBody = {
        photoId,
        text,
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)
        .expect(CREATED)
      const searched = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searched.dataValues.id

      const response = await userSession
        .delete("/captions/" + captionId)
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })

    it("When admin tries to delete another user's caption given caption id, then respective caption is deleted", async function () {
      const expected = "has deleted one of user id"
      const photoId = 1
      const text = "Awesome"
      const requestBody = {
        photoId,
        text,
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody)
        .expect(CREATED)
      const searched = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searched.dataValues.id

      const response = await adminSession
        .delete("/captions/" + captionId)
        .set("x-csrf-token", adminCsrfToken)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })

  describe("Put /:captionId", function () {
    it("When user tries to update another user's caption, then response is forbidden", async function () {
      const expected = "Forbidden."
      const captionId = 1
      const requestBody = {
        text: "Not awesome, the best",
      }

      const response = await userSession
        .put("/captions/" + captionId)
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, FORBIDDEN)
      assert.strictEqual(response.text, expected)
    })

    it("When user tries to update one of their own caption's given a caption id and new caption text, then respective caption is updated", async function () {
      const expected = "has updated one of their caption with id"
      const photoId = 1
      const text = "Awesome"
      const requestBody1 = {
        photoId,
        text,
      }
      await userSession
        .post("/captions")
        .set("x-csrf-token", csrfToken)
        .send(requestBody1)
        .expect(CREATED)
      const searched = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searched.dataValues.id
      const requestBody = {
        text: "Not awesome, the best",
      }

      const response = await userSession
        .put("/captions/" + captionId)
        .set("x-csrf-token", csrfToken)
        .send(requestBody)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
