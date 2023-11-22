const {
  axios,
  initializeWebServer,
  stopWebServer,
  describe,
  expect,
  httpStatusCodes,
} = require("../common")

const { OK } = httpStatusCodes

describe("Starting page", () => {
  let axiosAPIClient

  before(async function () {
    const apiConnection = await initializeWebServer()

    const axiosConfig = {
      baseURL: `https://localhost:${apiConnection.port}`,
      validateStatus: () => true,
    }

    axiosAPIClient = axios.create(axiosConfig)
  })

  after(async function () {
    await stopWebServer()
  })

  describe("/", () => {
    it("When request is made for the starting page, then response is ok with a message", async function () {
      const expected = "Welcome to the social media app Caption!!"

      const { data: responseData, status: responseStatus } =
        await axiosAPIClient.get("/")

      expect(responseStatus).to.equal(OK)
      expect(responseData).to.equal(expected)
    })
  })
})
