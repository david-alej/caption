const {
  app,
  assert,
  request,
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

const { OK, CREATED, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Logout routes", function () {
  const userCredentials = {}

  let client
  let csrfToken
  let noCookiesClient
  let setHeaders = { headers: { cookie: "" } }

  before(async function () {
    userCredentials.username = generateUsername()
    userCredentials.password = generatePassword()
    userCredentials.withCredentials = true

    const apiConnection = await initializeWebServer()

    axiosConfig.baseURL += apiConnection.port

    client = axios.create(axiosConfig)

    const { status } = await client.post("/register", userCredentials)

    const {
      status: status1,
      data,
      headers,
    } = await client.post("/login", userCredentials)

    setHeaders.headers.cookie = headers["set-cookie"]

    csrfToken = data.csrfToken

    userCredentials.username = generateUsername()
    userCredentials.password = generatePassword()
    axiosConfig.withCredentials = false

    noCookiesClient = axios.create(axiosConfig)

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

  describe("Get /", function () {
    it("When the request does not have cookies attached, then response is bad request #authorize", async function () {
      const expected = "Bad request."
      const expectedOne = 1
      const newCredentials = {
        username: generateUsername(),
        password: generatePassword(),
      }
      const { status: registerStatus } = await noCookiesClient.post(
        "/register",
        newCredentials
      )
      const { status: loginStatus } = await noCookiesClient.post(
        "/login",
        newCredentials
      )

      const { status, data } = await noCookiesClient.get("/logout")

      const deleted = await models.User.destroy({
        where: { username: newCredentials.username },
      })

      expect(registerStatus).to.equal(CREATED)
      expect(loginStatus).to.equal(OK)
      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(expectedOne)
    })

    it("When valid request is made, then response is ok", async function () {
      const { status } = await client.get("/logout", setHeaders)

      expect(status).to.equal(OK)
    })
  })

  describe("Post /", function () {
    it("When the request does not have cookies attached, then unauthorized message is sent #authorize", async function () {
      const expected = "Bad request."

      const { status, data } = await client.post("/logout")

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
    })

    // eslint-disable-next-line quotes
    it('When request does have cookies but does not include a "x-csrf-token" with csrf token, then the response is "invalid csrf token" #doubleCsrfProtection', async function () {
      const expected = "invalid csrf token"

      const { status, data } = await client.post("/logout", setHeaders)

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When a valid request is made (has cookies and csrf-token as a header), then user is logged out", async function () {
      const expected = " is now logged out."

      const response = await client
        .post("/logout")
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
