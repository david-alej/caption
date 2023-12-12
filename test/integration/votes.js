const {
  axios,
  axiosConfig,
  initializeWebServer,
  stopWebServer,
  expect,
  httpStatusCodes,
  generatePassword,
  generateUsername,
  models,
} = require("../common")

const { OK, BAD_REQUEST, CREATED, NOT_FOUND } = httpStatusCodes

describe.only("Votes route", function () {
  const userCredentials = {}

  let client
  let setHeaders = { headers: {} }
  let loggedInUserId

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

    const { status: getUserStatus, data: user } = await client.get(
      "/users/" + userCredentials.username,
      setHeaders
    )

    loggedInUserId = user.id

    expect(status).to.equal(CREATED)
    expect(status1).to.equal(OK)
    expect(getUserStatus).to.equal(OK)
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

  describe("Post /:captionId", function () {
    it("When captionId does not represent an existin caption, Then #paramVotes", async function () {
      const captionId = 1000 + Math.floor(Math.random() * 500)
      const requestBody = { voteValue: 1 }

      const { status, data } = await client.post(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal("Not found.")
    })

    it("When vote value is a string, Then repsonse is bad request #votesValidator", async function () {
      const captionId = 2
      const requestBody = { voteValue: "asdf" }

      const { status, data } = await client.post(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
    })

    it("When you already voted for a caption, Then repsonse is bad request #votesValidator", async function () {
      const captionId = 2
      const requestBody = { voteValue: 1 }
      await models.Vote.create(
        {
          captionId,
          userId: loggedInUserId,
          value: requestBody.voteValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          returning: ["*"],
          fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
        }
      )

      const { status, data } = await client.post(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
    })

    it("When voteValue is -1 or 1, Then row is created in votes to represent user voted on caption and votes of caption is incremented by vote value", async function () {
      const captionId = 2
      const requestBody = { voteValue: -1 }
      const searchedCaptionVotesBefore = await models.Caption.findOne({
        where: { id: captionId },
      })
      const captionsVotesBefore = searchedCaptionVotesBefore.dataValues.votes

      const { status, data } = await client.post(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )
      const searchedCaptionVotesAfter = await models.Caption.findOne({
        where: { id: captionId },
      })
      const captionsVotesAfter = searchedCaptionVotesAfter.dataValues.votes

      const deleted = await models.Vote.destroy({
        where: { captionId, userId: loggedInUserId },
      })
      const incremented = await models.Caption.increment(
        { votes: -1 * requestBody.voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionVotesDeconstruct = incremented[0][1]

      expect(status).to.equal(CREATED)
      expect(data).to.equal(
        `User: ${loggedInUserId} has voted ${requestBody.voteValue} on caption ${captionId}.`
      )
      expect(captionsVotesBefore).to.be.equal(
        captionsVotesAfter - requestBody.voteValue
      )
      expect(deleted).to.equal(1)
      expect(captionsVotesBefore).to.be.equal(captionVotesDeconstruct)
    })
  })

  describe("Put /:captionId", function () {
    it("When user tries to update vote on a caption that is non-existent, Then response is bad request", async function () {
      const captionId = 4
      const requestBody = { voteValue: 1 }

      const { status, data } = await client.put(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
    })

    it("When user tries to update vote on a caption that is the same vote value as before, Then response is bad request", async function () {
      const captionId = 4
      const requestBody = { voteValue: 1 }
      await models.Vote.create(
        {
          captionId,
          userId: loggedInUserId,
          value: requestBody.voteValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          returning: ["*"],
          fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
        }
      )

      const { status, data } = await client.put(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
    })

    it("When user updates a vote to a different vote value, Then ", async function () {
      const captionId = 6
      const requestBody = { voteValue: 1 }
      const incrementedCaptionVotesBefore = await models.Caption.increment(
        { votes: -requestBody.voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesBefore = incrementedCaptionVotesBefore[0][1]
      await models.Vote.create(
        {
          userId: loggedInUserId,
          captionId,
          value: -requestBody.voteValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          returning: ["*"],
          fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
        }
      )

      const { status, data } = await client.put(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      const incrementedCaptionVotesAfter = await models.Caption.increment(
        { votes: -requestBody.voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesAfter = incrementedCaptionVotesAfter[0][1]
      const deletedVote = await models.Vote.destroy({
        where: { captionId, userId: loggedInUserId },
      })

      expect(status).to.equal(OK)
      expect(data).to.equal(
        `User: ${loggedInUserId} has updated their vote on caption id ${captionId} with vote value ${requestBody.voteValue}`
      )
      expect(captionsVotesBefore).to.equal(captionsVotesAfter)
      expect(deletedVote).to.equal(1)
    })
  })
})
