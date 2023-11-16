const {
  app,
  assert,
  describe,
  httpStatusCodes,
  // models,
  session,
} = require("../common")

const { OK, CREATED, BAD_REQUEST } = httpStatusCodes

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
  // let loggedInUserId = ""

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

    // const searched = await models.User.findOne({
    //   where: { username: userCredentials.username },
    // })
    // loggedInUserId = searched.dataValues.id

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
    it("When more than two valid request body inputs are put into the request body, then response is bad request", async function () {
      const expected = "Bad request."
      const requestBody = {
        userId: 3,
        photoId: 3,
        username: "penguinlover",
      }

      const response = await userSession.get("/captions/").send(requestBody)

      assert.strictEqual(response.status, BAD_REQUEST)
      assert.strictEqual(response.text, expected)
    })
  })
})
