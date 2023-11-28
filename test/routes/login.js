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

const { OK, UNAUTHORIZED } = httpStatusCodes

describe("Login routes", function () {
  let client

  before(async function () {
    const apiConnection = await initializeWebServer()

    const currentAxiosConfig = { ...axiosConfig }

    currentAxiosConfig.baseURL += apiConnection.port

    client = axios.create(currentAxiosConfig)
  })

  after(async function () {
    await stopWebServer()
  })

  describe("Get /", function () {
    it("When valid request is made, then status is ok", async function () {
      const { status } = await client.get("/login")

      expect(status).to.equal(OK)
    })
  })

  describe("Post /", function () {
    it("When username that does not exist, then response is an unauthorized #usernameExists #authenticate", async function () {
      const expected = "Unauthorized."
      const credentials = {
        username: "nonExistingUsername",
        password: "blahblah1Q",
      }

      const { data, status } = await client.post("/login", credentials)

      expect(status).to.equal(UNAUTHORIZED)
      expect(data).to.equal(expected)
    })

    it("When password does not match existing password, then response is unauthorized #correctPassword #authenticate", async function () {
      const expected = "Unauthorized."
      const expectedOne = 1
      const setupCredentials = {
        username: generateUsername(),
        password: generatePassword(),
      }
      const credentials = {
        username: setupCredentials.username,
        password: "wrongPassword0",
      }
      await client.post("/register", setupCredentials)

      const { status, data } = await client.post("/login", credentials)

      const deleted = await models.User.destroy({
        where: { username: setupCredentials.username },
      })

      expect(status).to.equal(UNAUTHORIZED)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(expectedOne)
    })

    it("When authentication works, then user is logged in #authenticate", async function () {
      const expectedOne = "User: "
      const expectedTwo = " is now logged in."
      const expectedThree = 1
      const setupCredentials = {
        username: generateUsername(),
        password: generatePassword(),
      }
      const credentials = setupCredentials
      await client.post("/register", setupCredentials)

      const { status, data } = await client.post("/login", credentials)

      const deleted = await models.User.destroy({
        where: { username: setupCredentials.username },
      })

      expect(status).to.equal(OK)
      expect(data.message)
        .to.include.all.string(expectedOne)
        .and.string(expectedTwo)
      expect(deleted).to.equal(expectedThree)
    })
  })
})
