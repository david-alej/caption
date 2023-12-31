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
  preUserMsg,
} = require("../common")

const { OK, CREATED, NOT_FOUND, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Users route", function () {
  const userCredentials = {}
  const adminCredentials = {
    username: "yomaster",
    password: "yoyoyo1Q",
  }

  let client
  let setHeaders = { headers: {} }

  before(async function () {
    userCredentials.username = generateUsername()
    userCredentials.password = generatePassword()

    const apiConnection = await initializeWebServer()

    const currentAxiosConfig = { ...axiosConfig }

    currentAxiosConfig.baseURL += apiConnection.port

    client = axios.create(currentAxiosConfig)

    const { status } = await client.post("/register", userCredentials)

    const {
      status: status1,
      data,
      headers,
    } = await client.post("/login", userCredentials)

    setHeaders.headers.Cookie = headers["set-cookie"]
    setHeaders.headers["x-csrf-token"] = data.csrfToken

    expect(status).to.equal(CREATED)
    expect(status1).to.equal(OK)
  })

  after(async function () {
    const deleted = await models.User.destroy({
      where: { username: userCredentials.username },
    })

    await stopWebServer()

    expect(deleted).to.equal(1)
  })

  const usersSchema = {
    title: "Users schema",
    type: "array",
    items: {
      type: "object",
      required: [
        "id",
        "username",
        "isAdmin",
        "createdAt",
        "updatedAt",
        "photos",
      ],
      properties: {
        photos: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
      not: { required: ["password"] },
    },
  }

  const userSchema = {
    title: "Users schema",
    type: "object",
    required: ["id", "username", "isAdmin", "createdAt", "updatedAt", "photos"],
    properties: {
      photos: {
        type: "array",
        items: {
          type: "object",
        },
      },
    },
    not: { required: ["password"] },
  }

  describe("Get /", function () {
    it("When an authorized request is made, then all the users are in the response", async function () {
      const expected = [
        {
          username: userCredentials.username,
          isAdmin: false,
        },
        {
          id: 4,
          username: "yomaster",
          isAdmin: true,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 3,
          username: "penguinlover",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 2,
          username: "Carkeys23307",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
        {
          id: 1,
          username: "rina.dark",
          isAdmin: false,
          createdAt: "2023-11-02T20:00:00.000Z",
          updatedAt: "2023-11-02T20:00:00.000Z",
        },
      ]

      const { status, data: users } = await client.get("/users", setHeaders)
      console.log(users)
      expect(status).to.equal(OK)
      expect(users).to.be.jsonSchema(usersSchema)
      for (let i = 0; i < expected.length; i++) {
        const user = users[parseInt(i)]
        const expectedUser = expected[parseInt(i)]
        const userPhotos = user.photos

        expect(user).to.include(expectedUser)

        expect(userPhotos.length).to.be.below(11)

        if (i === expected.length - 1) break

        const userId = users[parseInt(i)].id
        const nextUserId = users[parseInt(i + 1)].id

        expect(userId).to.be.above(nextUserId)
      }
    })
  })

  describe("Get /:username", function () {
    it("When given username is invalid, then the response is bad request #usernameValidator #paramUsername", async function () {
      const expected = "Bad request."
      const usernameSearch = "usernam e"

      const { status, data } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When given username does not exist in the database, then the response is a not found message #paramUsername", async function () {
      const expected = "Not found."
      const usernameSearch = "nonExisitngUsername"

      const { status, data } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal(expected)
    })

    it("When given username does exist in the database, then the user is in the response", async function () {
      const usernameSearch = "penguinlover"
      const expected = {
        username: usernameSearch,
        isAdmin: false,
        createdAt: "2023-11-02T20:00:00.000Z",
        updatedAt: "2023-11-02T20:00:00.000Z",
      }

      const { status, data: user } = await client.get(
        "/users/" + usernameSearch,
        setHeaders
      )
      const photos = user.photos

      expect(status).to.equal(OK)
      expect(user).to.be.jsonSchema(userSchema)
      expect(user).to.include(expected)
      expect(photos.length).to.be.below(11)
      for (let i = 0; i < photos.length - 1; i++) {
        const previousPhotoId = photos[parseInt(i)].id
        const photoId = photos[parseInt(i + 1)].id

        expect(previousPhotoId).to.be.above(photoId)
      }
    })
  })

  describe("Put /", function () {
    const putUserCredentials = {}
    const putUserNewCredentials = {}

    let putSetHeaders = { headers: {} }

    beforeEach(async function () {
      putUserCredentials.username = generateUsername()
      putUserCredentials.password = generatePassword()
      putUserNewCredentials.newUsername = generateUsername()
      putUserNewCredentials.newPassword = generatePassword()

      const { status } = await client.post("/register", putUserCredentials)

      const {
        status: status1,
        data,
        headers,
      } = await client.post("/login", putUserCredentials)

      putSetHeaders.headers.Cookie = headers["set-cookie"]
      putSetHeaders.headers["x-csrf-token"] = data.csrfToken

      expect(status).to.equal(CREATED)
      expect(status1).to.equal(OK)
    })

    afterEach(async function () {
      const deleted = await models.User.destroy({
        where: { username: putUserCredentials.username },
      })

      expect(deleted).to.equal(1)
    })

    it("When no new credentials are added, then response is a bad request", async function () {
      const expected = "Bad request."
      const requestBody = putUserCredentials

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When a new username is entered but it already exists, then response is a bad request", async function () {
      const requestBody = {
        ...putUserCredentials,
        newUsername: putUserCredentials.username,
      }
      const expected = "Bad request."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    it("When a valid new username is provided, then response is ok", async function () {
      const { password } = putUserCredentials
      const { newUsername } = putUserNewCredentials
      const requestBody = { ...putUserCredentials, newUsername }
      const afterMsg = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: status1 } = await client.post("/login", {
        username: newUsername,
        password: password,
      })
      putUserCredentials.username = newUsername

      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(status1).to.equal(OK)
    })

    it("When a valid new password is provided, then response is ok", async function () {
      const { username } = putUserCredentials
      const { newPassword } = putUserNewCredentials
      const requestBody = { ...putUserCredentials, newPassword }
      const { status: firstSearchStatus, data: oldUser } = await client.get(
        "/users/" + username,
        putSetHeaders
      )
      const oldUpdatedAt = oldUser.updatedAt
      const afterMsg = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: loginStatus } = await client.post("/login", {
        username: username,
        password: newPassword,
      })
      const { status: searchStatus, data: user } = await client.get(
        "/users/" + username,
        putSetHeaders
      )
      const newUpdatedAt = user.updatedAt

      expect(firstSearchStatus).to.equal(OK)
      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(loginStatus).to.equal(OK)
      expect(searchStatus).to.equal(OK)
      expect(new Date(newUpdatedAt)).to.be.afterTime(new Date(oldUpdatedAt))
    })

    it("When both new credentials are added and valid, then response is ok", async function () {
      const { newUsername, newPassword } = putUserNewCredentials
      const requestBody = {
        ...putUserCredentials,
        newUsername,
        newPassword,
      }
      const afterMsg = " has updated either/both their username or password."

      const { status, data } = await client.put(
        "/users/",
        requestBody,
        putSetHeaders
      )

      const { status: status1 } = await client.post("/login", {
        username: newUsername,
        password: newPassword,
      })
      putUserCredentials.username = newUsername

      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(status1).to.equal(OK)
    })
  })

  describe("Delete /:username", function () {
    const deleteUserCredentials = {}
    let deleteSetHeaders = { headers: {} }

    beforeEach(async function () {
      deleteUserCredentials.username = generateUsername()
      deleteUserCredentials.password = generatePassword()

      const { status } = await client.post("/register", deleteUserCredentials)

      const {
        status: status1,
        data,
        headers,
      } = await client.post("/login", deleteUserCredentials)

      deleteSetHeaders.headers.Cookie = headers["set-cookie"]
      deleteSetHeaders.headers["x-csrf-token"] = data.csrfToken

      expect(status).to.equal(CREATED)
      expect(status1).to.equal(OK)
    })

    it("When regular user tries to delete other user, then response is forbidden", async function () {
      const expected = "Forbidden."
      const expectedOne = 1
      const usernameSearch = deleteUserCredentials.username

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        setHeaders
      )

      const deleted = await models.User.destroy({
        where: { username: deleteUserCredentials.username },
      })

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(expectedOne)
    })

    it("When username given is the logged in user, then user is deleted with a response message", async function () {
      const afterMsg = " has deleted their own account."
      const nothingFound = null
      const usernameSearch = deleteUserCredentials.username
      const requestBody = deleteUserCredentials
      deleteSetHeaders.data = requestBody

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        deleteSetHeaders
      )

      const searched = await models.User.findOne({
        where: {
          username: deleteUserCredentials.username,
        },
      })

      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(searched).to.equal(nothingFound)
    })

    it("When user deletes themselves and tries to use protected route, logout, then response is bad request due to invalid cookies", async function () {
      const usernameSearch = deleteUserCredentials.username
      const requestBody = deleteUserCredentials
      deleteSetHeaders.data = requestBody
      const { status } = await client.delete(
        "/users/" + usernameSearch,
        deleteSetHeaders
      )

      const { status: logoutStatus } = await client.post(
        "/logout",
        {},
        deleteSetHeaders
      )

      expect(status).to.equal(OK)
      expect(logoutStatus).to.equal(BAD_REQUEST)
    })

    it("When admin inputs username to delete another user, then user is deleted with a response message", async function () {
      const afterMsg = " has deleted user"
      const nothingFound = null
      const usernameSearch = deleteUserCredentials.username
      const { data: data1, headers: headers1 } = await client.post(
        "/login",
        adminCredentials
      )
      const adminSetHeaders = {
        headers: {
          Cookie: headers1["set-cookie"],
          "x-csrf-Token": data1.csrfToken,
        },
        data: adminCredentials,
      }

      const { status, data } = await client.delete(
        "/users/" + usernameSearch,
        adminSetHeaders
      )

      const searched = await models.User.findOne({
        where: { username: usernameSearch },
      })

      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(searched).to.equal(nothingFound)
    })
  })
})
