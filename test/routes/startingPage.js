const {
  app,
  assert,
  describe,
  httpStatusCodes,
  request,
  server,
} = require("../common")

const { OK } = httpStatusCodes

describe("Starting page", () => {
  after(async function () {
    server.close()
  })

  describe("/", () => {
    it("When request is made for the starting page, then response is ok with a message", async function () {
      const expected = "Welcome to the social media app Caption!!"

      const response = await request(app).get("/")

      assert.strictEqual(response.status, OK)
      assert.strictEqual(response.text, expected)
    })
  })
})
