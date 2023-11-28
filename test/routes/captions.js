const {
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  httpStatusCodes,
  models,
  generatePassword,
  generateUsername,
} = require("../common")

const { OK, CREATED, NOT_FOUND, FORBIDDEN } = httpStatusCodes

const fs = require("node:fs")

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

  describe("Post /", function () {
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
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.delete("/captions", config)

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When user does not input anything into request body, then all of captions of the logged in user are deleted", async function () {
      const requestBody = {}
      const requestBody1 = {
        photoId: 1,
        text: "caption text",
      }
      const requestBody2 = {
        photoId: 1,
        text: "caption text 1",
      }
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const { status: captionTwoStatus } = await client.post(
        "/captions",
        requestBody2,
        setHeaders
      )
      const expected = "has deleted all of their own captions associated"
      const expectedOne = 0
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.delete("/captions", config)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId },
      })

      expect(captionOneStatus).to.equal(CREATED)
      expect(captionTwoStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
    })

    it("When user inputs their own user id into the request body, then all of captions of the logged in user are deleted", async function () {
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
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const { status: captionTwoStatus } = await client.post(
        "/captions",
        requestBody2,
        setHeaders
      )
      const expected = "has deleted all of their own captions associated"
      const expectedOne = 0
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.delete("/captions", config)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId },
      })

      expect(captionOneStatus).to.equal(CREATED)
      expect(captionTwoStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
    })

    it("When user inputs a photo id into the request body, then all of captions of the the respective photo owned by the logged in user", async function () {
      const photoId = 1
      const requestBody = {
        photoId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const expected = "has deleted all of their own captions associated"
      const expectedOne = 0
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = requestBody

      const { status, data } = await client.delete("/captions", config)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId, photoId },
      })

      expect(captionOneStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
    })

    it("When an admin inputs a different user's user id into the request body, then all of captions owned by the different user are deleted", async function () {
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
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const { status: captionTwoStatus } = await client.post(
        "/captions",
        requestBody2,
        setHeaders
      )
      const expected = "has deleted all of the captions associated"
      const expectedOne = 0
      const config = JSON.parse(JSON.stringify(adminSetHeaders))
      config.data = requestBody

      const { status, data } = await client.delete("/captions", config)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId, photoId },
      })

      expect(captionOneStatus).to.equal(CREATED)
      expect(captionTwoStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
    })

    it("When an admin inputs a photo id into the request body, then all of captions owned by the different user are deleted", async function () {
      const title = "title"
      const filePath = "./public/img/photo-tests/title.jpeg"
      const userConfig = JSON.parse(JSON.stringify(setHeaders))
      userConfig.headers["Content-Type"] = "multipart/form-data"
      const createPhotoData = {
        title,
        photo: fs.createReadStream(filePath),
      }
      const { status: createPhotoStatus } = await client.post(
        "/photos/",
        createPhotoData,
        userConfig
      )
      const searchedPhotoId = await models.Photo.findOne({
        where: { userId: loggedInUserId },
      })
      const photoId = searchedPhotoId.dataValues.id
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
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const { status: captionTwoStatus } = await client.post(
        "/captions",
        requestBody2,
        setHeaders
      )
      const expected = "has deleted all of the captions associated"
      const expectedOne = 1
      const adminConfig = JSON.parse(JSON.stringify(adminSetHeaders))
      adminConfig.data = requestBody

      const { status, data } = await client.delete("/captions", adminConfig)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId },
      })
      const { status: deletePhotoStatus } = await client.delete(
        "/photos/" + photoId,
        adminSetHeaders
      )

      expect(createPhotoStatus).to.equal(CREATED)
      expect(captionOneStatus).to.equal(CREATED)
      expect(captionTwoStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
      expect(deletePhotoStatus).to.equal(OK)
    })

    it("When an admin inputs a different user's user id and photo id into the request body, then all of captions of the respective photo owned by the different user are deleted", async function () {
      const photoId = 1
      const requestBody = {
        userId: loggedInUserId,
        photoId,
      }
      const requestBody1 = {
        photoId,
        text: "caption text",
      }
      const { status: captionOneStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const expected = "has deleted all of the captions associated"
      const expectedOne = 0
      const adminConfig = JSON.parse(JSON.stringify(adminSetHeaders))
      adminConfig.data = requestBody

      const { status, data } = await client.delete("/captions", adminConfig)

      const searched = await models.Caption.findAll({
        where: { userId: loggedInUserId, photoId },
      })

      expect(captionOneStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched.length).to.equal(expectedOne)
    })
  })

  describe("Delete /:captionId", function () {
    it("When user tries to delete other user's caption, then response is forbidden", async function () {
      const expected = "Forbidden."
      const captionId = 5

      const { status, data } = await client.delete(
        "/captions/" + captionId,
        setHeaders
      )

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When user tries to delete one of their caption's given a caption id, then respective caption is deleted", async function () {
      const photoId = 1
      const text = "That is really cool art"
      const requestBody = {
        photoId,
        text,
      }
      const { status: createCaptionStatus } = await client.post(
        "/captions",
        requestBody,
        setHeaders
      )
      const searchedCaptionId = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searchedCaptionId.dataValues.id
      const expected = "has deleted one of their own captions."
      const expectedOne = null

      const { status, data } = await client.delete(
        "/captions/" + captionId,
        setHeaders
      )

      const searched = await models.Caption.findOne({
        where: { id: captionId },
      })

      expect(createCaptionStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched).to.equal(expectedOne)
    })

    it("When admin tries to delete another user's caption given caption id, then respective caption is deleted", async function () {
      const photoId = 1
      const text = "Awesome"
      const requestBody = {
        photoId,
        text,
      }
      const { status: createCaptionStatus } = await client.post(
        "/captions",
        requestBody,
        setHeaders
      )
      const searchedCaptionId = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searchedCaptionId.dataValues.id
      const expected = "has deleted one of user id"
      const expectedOne = null

      const { status, data } = await client.delete(
        "/captions/" + captionId,
        adminSetHeaders
      )

      const searched = await models.Caption.findOne({
        where: { id: captionId },
      })

      expect(createCaptionStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(searched).to.equal(expectedOne)
    })
  })

  describe("Put /:captionId", function () {
    it("When user tries to update another user's caption, then response is forbidden", async function () {
      const captionId = 1
      const requestBody = {
        text: "Not awesome, the best",
      }
      const expected = "Forbidden."

      const { status, data } = await client.put(
        "/captions/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When user tries to update one of their own caption's given a caption id and new caption text, then respective caption is updated", async function () {
      const photoId = 1
      const text = "Awesome"
      const requestBody1 = {
        photoId,
        text,
      }
      const { status: createCaptionStatus } = await client.post(
        "/captions",
        requestBody1,
        setHeaders
      )
      const searchedCaptionId = await models.Caption.findOne({
        where: { photoId, text },
      })
      const captionId = searchedCaptionId.dataValues.id
      const requestBody = {
        text: "Not awesome, the best",
      }
      const expected = "has updated one of their caption with id"
      const expectedOne = requestBody.text
      const expectedTwo = 1

      const { status, data } = await client.put(
        "/captions/" + captionId,
        requestBody,
        setHeaders
      )

      const searched = await models.Caption.findOne({
        where: { id: captionId },
      })
      const newText = searched.dataValues.text
      const deleted = await models.Caption.destroy({
        where: { id: captionId },
      })

      expect(createCaptionStatus).to.equal(CREATED)
      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(newText).to.equal(expectedOne)
      expect(deleted).to.equal(expectedTwo)
    })
  })
})
