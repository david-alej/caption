const {
  app,
  assert,
  describe,
  httpStatusCodes,
  models,
  request,
  server,
  session,
} = require("../common")

const { OK, CREATED, BAD_REQUEST, FORBIDDEN } = httpStatusCodes

describe("Logout routes", () => {
  const userCredentials = {
    username: "username",
    password: "Password1",
  }

  let userSession = ""
  let csrfToken = ""

  before(async function () {
    userSession = session(app)

    await userSession.post("/register").send(userCredentials).expect(CREATED)

    const loginResponse = await userSession
      .post("/login")
      .send(userCredentials)
      .expect(OK)

    csrfToken = JSON.parse(loginResponse.text).csrfToken
  })

  after(async function () {
    await models.User.destroy({ where: { username: userCredentials.username } })

    server.close()
  })

  describe("Get /", () => {
    it("When the request does not have cookies attached, then response is bad request #authorize", async function () {
      const expected = "Bad request."
      const newCredentials = {
        username: "username1",
        password: "Password1",
      }
      await request(app).post("/register").send(newCredentials).expect(CREATED)
      await request(app).post("/login").send(newCredentials).expect(OK)

      const response = await request(app).get("/logout")

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)

      await models.User.destroy({
        where: { username: newCredentials.username },
      })
    })

    it("When valid request is made, then response is ok", async function () {
      const response = await userSession.get("/logout")

      assert.strictEqual(response.status, OK)
    })
  })

  describe("Post /", () => {
    it("When the request does not have cookies attached, then unauthorized message is sent #authorize", async function () {
      const expected = "Bad request."

      const response = await request(app).post("/logout")

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.include(response.text, expected)
    })

    // eslint-disable-next-line quotes
    it('When request does have cookies but does not include a "x-csrf-token" with csrf token, then the response is "invalid csrf token" #doubleCsrfProtection', async function () {
      const expected = "invalid csrf token"

      const response = await userSession.post("/logout")

      assert.strictEqual(response.status, FORBIDDEN)
      assert.include(response.text, expected)
    })

    it("When a valid request is made (has cookies and csrf-token as a header), then user is logged out", async function () {
      const expected = " is now logged out."

      const response = await userSession
        .post("/logout")
        .set("x-csrf-token", csrfToken)

      assert.strictEqual(response.status, OK)
      assert.include(response.text, expected)
    })
  })
})
