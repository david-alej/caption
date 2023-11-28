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
  s3,
} = require("../common")

const { OK, CREATED, NO_CONTENT, NOT_FOUND, BAD_REQUEST, FORBIDDEN } =
  httpStatusCodes

const fs = require("node:fs")

describe("Photos route", function () {
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

    const searched = await models.User.findOne({
      where: { username: userCredentials.username },
    })
    loggedInUserId = searched.dataValues.id

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

  describe("Get /", function () {
    it("When two or more valid request body inputs are put into the request body, then response is bad request #allowedBodyInputsValidator", async function () {
      const expected = "Bad request."
      const requestBody = {
        userId: 3,
        title: "Me and my siblings",
      }
      const config = {
        data: requestBody,
      }

      const { status, data } = await client.get("/photos/", config)

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When valid request is made with no valid request body inputs, then all the top voted photos are returned ", async function () {
      this.timeout(5 * 1000)

      const expected = [
        {
          id: 2,
          userId: 2,
          title: "Sales Consultant",
          filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: "0",
        },
        {
          id: 1,
          userId: 1,
          title: "Designer",
          filename: "744fe784-f556-4c68-a81a-2e5d859e27ef.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: "0",
        },
        {
          id: 3,
          userId: 3,
          title: "Me and my siblings",
          filename: "cc30b9e6-0ae1-4753-86cf-9b81717030c2.jpg",
          createdAt: "2023-11-04T20:00:00.000Z",
          updatedAt: "2023-11-04T20:00:00.000Z",
          totalVotes: "0",
        },
      ]

      const { status, data } = await client.get("/photos/", setHeaders)

      expect(status).to.equal(OK)
      for (let i = 0; i < expected.length; i++) {
        expect(data).to.include(JSON.stringify(expected[parseInt(i)]))
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
      const config = setHeaders
      config.data = requestBody

      const { status, data } = await client.get("/photos/", config)

      expect(status).to.equal(OK)
      expect(data).to.include.string(expected.substring(0, expected.length - 1))
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
        totalVotes: "0",
      })
      const requestBody = { title: "Me and my siblings" }
      const config = setHeaders
      config.data = requestBody

      const { status, data } = await client.get("/photos/", config)

      expect(status).to.equal(OK)
      expect(data).to.include.string(expected.substring(0, expected.length - 1))
    })
  })

  describe("Get /:photoId", function () {
    it("When valid request is made but photoId is not an integer, then response is bad request #integerValidator", async function () {
      const expected = "Bad request."
      const photoId = "five"

      const { status, data } = await client.get(
        "/photos/" + photoId,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When valid request is made but photoId does not exists, then response is not found", async function () {
      const expected = "Not found."
      const photoId = "5"

      const { status, data } = await client.get(
        "/photos/" + photoId,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal(expected)
    })

    it("When valid request and photoId is an integer and exists, then the respective photo sent in a multipart form #attachFilesToResponse", async function () {
      const expected = JSON.stringify({
        id: 2,
        userId: 2,
        title: "Sales Consultant",
        filename: "a5f8cb21-a34f-4e15-a3a6-d3fe656b1d56.jpg",
        createdAt: "2023-11-04T20:00:00.000Z",
        updatedAt: "2023-11-04T20:00:00.000Z",
        captions: [
          {
            id: 1,
            userId: 1,
            photoId: 2,
            text: "Why is the dog on a chair",
            votes: 0,
            createdAt: "2023-11-04T20:01:00.000Z",
            updatedAt: "2023-11-04T20:01:00.000Z",
            author: {
              id: 1,
              username: "rina.dark",
              isAdmin: false,
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
        ],
        author: {
          id: 2,
          username: "Carkeys23307",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      })
      const photoId = "2"

      const { status, data } = await client.get(
        "/photos/" + photoId,
        setHeaders
      )

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
    })
  })

  describe("Post /", function () {
    it("When a file that is not the allowed image types that are jpg, png, and gif, then response is bad request ", async function () {
      const expected = "Bad request."
      const title = "image"
      const filePath = "./public/img/photo-tests/image.js"
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.headers["Content-Type"] = "multipart/form-data"

      const { status, data } = await client.post(
        "/photos/",
        { title, photo: fs.createReadStream(filePath) },
        config
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.include(expected)
    })

    it("When an allowed image type is uploaded as the file, then photo is created and the url to the photo is attached to the response ", async function () {
      this.timeout(5 * 1000)

      const title = "title"
      const expected = `/photos/${title}`
      const expectedOne = 1
      const filePath = "./public/img/photo-tests/title.jpeg"
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.headers["Content-Type"] = "multipart/form-data"

      const { status, data } = await client.post(
        "/photos/",
        { title, photo: fs.createReadStream(filePath) },
        config
      )

      const searched = await models.Photo.findOne({ where: { title } })
      const filename = searched.dataValues.filename
      const { httpStatusCode: s3PhotoStatus } = await s3.deleteFile(filename)
      const deleted = await models.Photo.destroy({
        where: {
          filename,
        },
      })

      expect(status).to.equal(CREATED)
      expect(data.imagePath).to.equal(expected)
      expect(s3PhotoStatus).to.equal(NO_CONTENT)
      expect(deleted).to.equal(expectedOne)
    })
  })

  describe("Delete /", function () {
    beforeEach(async function () {
      const title1 = "title"
      const title2 = "World Of Warcraft"
      const filePath1 = "./public/img/photo-tests/title.jpeg"
      const filePath2 = "./public/img/photo-tests/WOW.png"
      const config1 = JSON.parse(JSON.stringify(setHeaders))
      config1.headers["Content-Type"] = "multipart/form-data"
      const data1 = { title: title1, photo: fs.createReadStream(filePath1) }
      const data2 = { title: title2, photo: fs.createReadStream(filePath2) }

      const { status: status1 } = await client.post("/photos/", data1, config1)
      const { status: status2 } = await client.post("/photos/", data2, config1)

      expect(status1).to.equal(CREATED)
      expect(status2).to.equal(CREATED)
    })

    it("When regular user inputs another user's id to delete photos of another user, then response is forbidden ", async function () {
      const expected = "Forbidden."
      const expectedOne = 2
      const differentUserIdCredentials = { userId: 1 }
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = differentUserIdCredentials

      const { status, data } = await client.delete("/photos/", config)

      const searched = await models.Photo.findAll({
        where: { userId: loggedInUserId },
      })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })
      const deleted = await models.Photo.destroy({
        where: { userId: loggedInUserId },
      })
      const s3PhotoStatuses = []
      for (const filename of filenames) {
        const { httpStatusCode: s3PhotoStatus } = await s3.deleteFile(filename)
        s3PhotoStatuses.push(s3PhotoStatus)
      }

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(expectedOne)
      for (const s3PhotoStatus of s3PhotoStatuses) {
        expect(s3PhotoStatus).to.equal(NO_CONTENT)
      }
    })

    it("When user does not input anything to request body, then all of photos of the logged in user are deleted ", async function () {
      this.timeout(6 * 1000)

      const expectedOne = "has deleted all of their own photos associated"
      const expectedTwo = null
      const searched = await models.Photo.findAll({
        where: { userId: loggedInUserId },
      })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const { status, data } = await client.delete("/photos", setHeaders)

      const s3PhotoOne = await s3.getObjectData(filenames[0])
      const s3PhotoTwo = await s3.getObjectData(filenames[1])

      expect(status).to.equal(OK)
      expect(data).to.include(expectedOne)
      expect(s3PhotoOne).to.equal(expectedTwo)
      expect(s3PhotoTwo).to.equal(expectedTwo)
    })

    it("When user inputs their own user ids, then all of photos of the logged in user are deleted ", async function () {
      this.timeout(6 * 1000)

      const expectedOne = "has deleted all of the"
      const expectedTwo = null
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.data = { userId: loggedInUserId }
      const searched = await models.Photo.findAll({
        where: { userId: loggedInUserId },
      })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const { status, data } = await client.delete("/photos", config)

      const s3PhotoOne = await s3.getObjectData(filenames[0])
      const s3PhotoTwo = await s3.getObjectData(filenames[1])

      expect(status).to.equal(OK)
      expect(data).to.include(expectedOne)
      expect(s3PhotoOne).to.equal(expectedTwo)
      expect(s3PhotoTwo).to.equal(expectedTwo)
    })

    it("When an admin inputs their another user's user id, then all of photos of the choosen user are deleted ", async function () {
      this.timeout(7 * 1000)

      const expectedOne = "has deleted all of the"
      const expectedTwo = null
      const targetUserIdCredentials = { userId: loggedInUserId }
      const config = JSON.parse(JSON.stringify(adminSetHeaders))
      config.data = targetUserIdCredentials
      const searched = await models.Photo.findAll({
        where: targetUserIdCredentials,
      })
      const filenames = JSON.parse(JSON.stringify(searched)).map((photo) => {
        return photo.filename
      })

      const { status, data } = await client.delete("/photos", config)

      const s3PhotoOne = await s3.getObjectData(filenames[0])
      const s3PhotoTwo = await s3.getObjectData(filenames[1])

      expect(status).to.equal(OK)
      expect(data).to.include(expectedOne)
      expect(s3PhotoOne).to.equal(expectedTwo)
      expect(s3PhotoTwo).to.equal(expectedTwo)
    })
  })

  describe("Delete /:photoId", function () {
    let photoId

    beforeEach(async function () {
      const title = "title"
      const filePath = "./public/img/photo-tests/title.jpeg"
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.headers["Content-Type"] = "multipart/form-data"
      const data1 = {
        title: title,
        photo: fs.createReadStream(filePath),
      }

      const { status } = await client.post("/photos/", data1, config)
      delete config.headers["Content-TYpe"]

      const searched = await models.Photo.findOne({
        where: { userId: loggedInUserId },
      })
      photoId = searched.dataValues.id

      expect(status).to.equal(CREATED)
    })

    it("When valid request is made but given photo id in route parameters is a photo not owned by the logged in user, then response is forbidden ", async function () {
      const expected = "Forbidden."
      const expectedOne = 1
      const photoIdSearch = "1"

      const { status, data } = await client.delete(
        "/photos/" + photoIdSearch,
        setHeaders
      )

      const searched = await models.Photo.findOne({ where: { id: photoId } })
      const filename = searched.dataValues.filename
      const { httpStatusCode: s3PhotoStatus } = await s3.deleteFile(filename)
      const deleted = await models.Photo.destroy({
        where: {
          filename,
        },
      })

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
      expect(s3PhotoStatus).to.equal(NO_CONTENT)
      expect(deleted).to.equal(expectedOne)
    })

    it("When the logged in user tries to delete one of their photo's by photo id, then photo with respective id is deleted ", async function () {
      const expected = "has deleted one of "
      const expectedOne = null
      const config = JSON.parse(JSON.stringify(setHeaders))
      const beforeSearched = await models.Photo.findOne({
        where: { id: photoId },
      })
      const filename = beforeSearched.dataValues.filename

      const { status, data } = await client.delete("/photos/" + photoId, config)

      const afterSearched = await models.Photo.findOne({
        where: { id: photoId },
      })
      const s3Photo = await s3.getObjectData(filename)

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(afterSearched).to.equal(expectedOne)
      expect(s3Photo).to.equal(expectedOne)
    })

    it("When an admin tries to delete an another users photo by photo id, then the users respective photo is deleted ", async function () {
      const expected = "has deleted one of "
      const expectedOne = null
      const beforeSearched = await models.Photo.findOne({
        where: { id: photoId },
      })
      const filename = beforeSearched.dataValues.filename

      const { status, data } = await client.delete(
        "/photos/" + photoId,
        adminSetHeaders
      )

      const afterSearched = await models.Photo.findOne({
        where: { id: photoId },
      })
      const s3Photo = await s3.getObjectData(filename)

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(afterSearched).to.equal(expectedOne)
      expect(s3Photo).to.equal(expectedOne)
    })
  })

  describe("Put /", function () {
    it("When users trues to update a different user's photo by given photo id, then response is forbidden", async function () {
      const expected = "Forbidden."
      const newTitle = "New title"
      const requestBody = { title: newTitle }
      const config = JSON.parse(JSON.stringify(setHeaders))
      const photoId = 1

      const { status, data } = await client.put(
        "/photos/" + photoId,
        requestBody,
        config
      )

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When admin tries to update a user's photo by photo id, then response is forbidden ", async function () {
      const expected = "Forbidden."
      const photoId = 1
      const newTitle = "New title"
      const requestBody = { title: newTitle }
      const config = JSON.parse(JSON.stringify(adminSetHeaders))

      const { status, data } = await client.put(
        "/photos/" + photoId,
        requestBody,
        config
      )

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When user tries to update one of their photo's by photo id, then the users respective photo is deleted ", async function () {
      this.timeout(10 * 1000)

      const title = "title"
      const filePath = "./public/img/photo-tests/title.jpeg"
      const config = JSON.parse(JSON.stringify(setHeaders))
      config.headers["Content-Type"] = "multipart/form-data"
      const postData = { title, photo: fs.createReadStream(filePath) }
      await client.post("/photos/", postData, config)
      delete config.headers["Content-Type"]
      const beforeSearch = await models.Photo.findOne({
        where: { userId: loggedInUserId },
      })
      const photoId = beforeSearch.dataValues.id
      const newTitle = "New title"
      const putData = { title: newTitle }
      const expected = "has updated one of their photo with id " + photoId + "."
      const expectedOne = 1

      const { status, data } = await client.put(
        "/photos/" + photoId,
        putData,
        config
      )

      const afterSearch = await models.Photo.findOne({
        where: {
          id: photoId,
        },
      })
      const currentTitle = afterSearch.dataValues.title
      const deleted = await models.Photo.destroy({
        where: {
          id: photoId,
        },
      })
      const { httpStatusCode: status2 } = await s3.deleteFile(
        afterSearch.dataValues.filename
      )

      expect(status).to.equal(OK)
      expect(data).to.include(expected)
      expect(currentTitle).to.equal(newTitle)
      expect(deleted).to.equal(expectedOne)
      expect(status2).to.equal(NO_CONTENT)
    })
  })
})
