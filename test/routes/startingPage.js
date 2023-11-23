const {
  axios,
  axiosConfig,
  expect,
  httpStatusCodes,
  initializeWebServer,
  stopWebServer,
} = require("../common")

const { OK } = httpStatusCodes

describe("Starting page", function () {
  let axiosAPIClient

  before(async function () {
    const apiConnection = await initializeWebServer()

    axiosConfig.baseURL += apiConnection.port

    axiosAPIClient = axios.create(axiosConfig)
  })

  after(async function () {
    await stopWebServer()
  })

  describe("/", function () {
    it("When request is made for the starting page, then response is ok with a message", async function () {
      const expected = "Welcome to the social media app Caption!!"

      const { data, status } = await axiosAPIClient.get("/")

      expect(status).to.equal(OK)
      expect(data).to.equal(expected)
    })
  })
})
