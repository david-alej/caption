const {
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  generatePassword,
  generateUsername,
  httpStatusCodes,
  models,
  preUserMsg,
} = require("../common")

const { OK, CREATED, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Logout routes", function () {
  const userCredentials = {}

  let client
  let csrfToken
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

    csrfToken = data.csrfToken

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
      const usersDeleted = 1
      const newCredentials = {
        username: generateUsername(),
        password: generatePassword(),
      }
      const { status: registerStatus } = await client.post(
        "/register",
        newCredentials
      )
      const { status: loginStatus } = await client.post(
        "/login",
        newCredentials
      )

      const { status, data } = await client.get("/logout")

      const deleted = await models.User.destroy({
        where: { username: newCredentials.username },
      })

      expect(registerStatus).to.equal(CREATED)
      expect(loginStatus).to.equal(OK)
      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal(expected)
      expect(deleted).to.equal(usersDeleted)
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

      const { status, data } = await client.post("/logout", {}, setHeaders)

      expect(status).to.equal(FORBIDDEN)
      expect(data).to.equal(expected)
    })

    it("When a valid request is made (has cookies and csrf-token as a header), then user is logged out", async function () {
      const afterMsg = " is now logged out."
      const configs = structuredClone(setHeaders)
      configs.headers["x-csrf-token"] = csrfToken

      const { status, data } = await client.post("/logout", {}, configs)

      const { status: retryLogoutStatus, data: retryLogoutData } =
        await client.post("/logout", {}, configs)

      expect(status).to.equal(OK)
      expect(data).to.include.string(preUserMsg).and.string(afterMsg)
      expect(retryLogoutStatus).to.equal(BAD_REQUEST)
      expect(retryLogoutData).to.equal("Bad request.")
    })

    it("When user logouts thus devalidating the cookies, and user tries to logout again, then cookies are rejected and response is bad request ", async function () {
      const configs = structuredClone(setHeaders)
      configs.headers["x-csrf-token"] = csrfToken
      const { status } = await client.post("/logout", {}, configs)

      const { status: retryLogoutStatus, data: retryLogoutData } =
        await client.post("/logout", {}, configs)

      expect(status).to.equal(OK)
      expect(retryLogoutStatus).to.equal(BAD_REQUEST)
      expect(retryLogoutData).to.equal("Bad request.")
    })
  })
})
