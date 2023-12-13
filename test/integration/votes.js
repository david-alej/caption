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
  const preExistingUserCredentials = {
    username: "penguinlover",
    password: "Alaska456",
    id: 3,
  }
  const userCredentials = {}

  let client
  let setHeaders = { headers: {} }
  let setHeadersPreExisting = { headers: {} }
  let loggedInUserId

  const voteObject = {
    type: "object",
    required: ["captionId", "userId", "value", "createdAt", "updatedAt"],
    properties: {
      captionId: {
        type: "number",
      },
      userId: {
        type: "number",
      },
      value: {
        type: "number",
      },
      createdAt: {
        type: "string",
      },
      updatedAt: {
        type: "string",
      },
    },
  }

  const votesSchema = {
    title: "Votes schema",
    type: "array",
    items: { ...voteObject },
  }

  let voteObjectWithCaption
  let voteSchema

  before(async function () {
    voteObjectWithCaption = structuredClone(voteObject)
    voteObjectWithCaption.required.push("caption")
    voteObjectWithCaption.properties.caption = {
      type: "object",
      required: ["votes"],
      properties: {
        votes: {
          type: "number",
        },
      },
    }

    voteSchema = {
      title: "Votes Schema",
      ...voteObjectWithCaption,
    }

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

    const {
      status: statusPreExisting,
      data: dataPreExisting,
      headers: headersPreExisting,
    } = await client.post("/login", preExistingUserCredentials)

    setHeadersPreExisting.headers.Cookie = headersPreExisting["set-cookie"]
    setHeadersPreExisting.headers["x-csrf-token"] = dataPreExisting.csrfToken

    expect(status).to.equal(CREATED)
    expect(status1).to.equal(OK)
    expect(getUserStatus).to.equal(OK)
    expect(statusPreExisting).to.equal(OK)
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
    it("When captionId does not represent an existing caption, Then #paramVotes", async function () {
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

      const deleted = await models.Vote.destroy({
        where: { captionId, userId: loggedInUserId },
      })

      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
      expect(deleted).to.equal(1)
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
      const captionVotesDeconstruct = incremented[0][0][0].votes

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
    it("When user tries to update vote on a caption that is non-existent, Then response is not found", async function () {
      const captionId = 4
      const requestBody = { voteValue: 1 }

      const { status, data } = await client.put(
        "/votes/" + captionId,
        requestBody,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal("Not found.")
    })

    it("When user tries to update vote on a caption that is the same vote value as before, Then response is bad request", async function () {
      const captionId = 4
      const requestBody = { voteValue: 1 }
      const createdVote = await models.Vote.create(
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

      const deletedVote = await models.Vote.destroy({
        where: { captionId, userId: loggedInUserId },
      })

      expect(createdVote).to.exist
      expect(status).to.equal(BAD_REQUEST)
      expect(data).to.equal("Bad request.")
      expect(deletedVote).to.equal(1)
    })

    it("When user updates a vote to a different vote value, Then vote value is updated on vote table and caption is updated accordingly", async function () {
      const captionId = 6
      const requestBody = { voteValue: 1 }
      const incrementedCaptionVotesBefore = await models.Caption.increment(
        { votes: -requestBody.voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesBefore = incrementedCaptionVotesBefore[0][0][0].votes
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
      const captionsVotesAfter = incrementedCaptionVotesAfter[0][0][0].votes
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

  describe("Delete /:captionId", function () {
    it("When user tries to delete vote on a caption that does not exist, Then response is not found", async function () {
      const captionId = 1

      const { status, data } = await client.delete(
        "/votes/" + captionId,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal("Not found.")
    })

    it("When user tries to delete vote on a caption that does exist, Then corresponding row on vote table is deleted and votes of caption is adjusted accordingly", async function () {
      const captionId = 3
      const voteValue = 1
      const incrementedCaptionVotesBefore = await models.Caption.increment(
        { votes: voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesBefore = incrementedCaptionVotesBefore[0][0][0].votes
      const createdVote = await models.Vote.create(
        {
          userId: loggedInUserId,
          captionId,
          value: voteValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          returning: ["*"],
          fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
        }
      )

      const { status, data } = await client.delete(
        "/votes/" + captionId,
        setHeaders
      )

      const searchedCaptionVotesAfter = await models.Caption.findOne({
        where: { id: captionId },
      })
      const captionsVotesAfter = searchedCaptionVotesAfter.dataValues.votes
      const searchedVote = await models.Vote.findOne({
        where: { captionId, userId: loggedInUserId },
        attributes: ["value"],
      })

      expect(createdVote).to.exist
      expect(status).to.equal(OK)
      expect(data).to.equal(
        `User: ${loggedInUserId} has deleted their vote on caption id ${captionId} with vote value ${voteValue}`
      )
      expect(captionsVotesBefore - voteValue).to.equal(captionsVotesAfter)
      expect(searchedVote).to.equal(null)
    })
  })

  describe("Delete /", function () {
    it("When no input is provided on the request body, Then all users votes are deleted", async function () {
      const captionIds = [1, 2, 3]
      const voteValues = [1, -1, 1]
      const captionVotesBefore = []
      const createdVotes = []

      for (let i = 0; i < captionIds.length; i++) {
        const captionId = captionIds[parseInt(i)]
        const voteValue = voteValues[parseInt(i)]
        const incrementedCaptionVotesBefore = await models.Caption.increment(
          { votes: voteValue },
          {
            where: { id: captionId },
          }
        )
        captionVotesBefore.push(incrementedCaptionVotesBefore[0][0][0].votes)
        const createdVote = await models.Vote.create(
          {
            userId: loggedInUserId,
            captionId,
            value: voteValue,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            returning: ["*"],
            fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
          }
        )
        createdVotes.push(createdVote)
      }
      const allVotesWhereCreated = createdVotes.every((vote) => {
        if (vote) return true
      })

      const { status, data } = await client.delete("/votes", setHeaders)

      const captionVotesAfter = []
      for (let i = 0; i < captionIds.length; i++) {
        const captionId = captionIds[parseInt(i)]

        const searchedCaptionVotesAfter = await models.Caption.findOne({
          where: { id: captionId },
        })
        captionVotesAfter.push(searchedCaptionVotesAfter.dataValues.votes)
      }
      const searchedVotesAfter = await models.Vote.findAll({
        where: { userId: loggedInUserId },
        attributes: ["value"],
      })
      const votesAfterDeleteAreNonexistent = searchedVotesAfter.every(
        (searchedVote) => {
          return searchedVote === null
        }
      )

      expect(allVotesWhereCreated).to.be.true
      expect(status).to.equal(OK)
      expect(data).to.equal(
        `User: ${loggedInUserId} has deleted ${captionIds.length} of their votes.`
      )
      expect(allVotesWhereCreated).to.be.true
      expect(votesAfterDeleteAreNonexistent).to.be.true
      for (let i = 0; i < captionIds.length; i++) {
        expect(
          captionVotesBefore[parseInt(i)] - voteValues[parseInt(i)]
        ).to.equal(captionVotesAfter[parseInt(i)])
      }
    })

    it("When photo id input is provided on the request body, Then all users votes on captions of a photo are deleted", async function () {
      const photoId = 2
      const captionIds = [6, 1]
      const voteValues = [1, 1]
      const captionVotesBefore = []
      const createdVotes = []

      for (let i = 0; i < captionIds.length; i++) {
        const captionId = captionIds[parseInt(i)]
        const voteValue = voteValues[parseInt(i)]
        const incrementedCaptionVotesBefore = await models.Caption.increment(
          { votes: voteValue },
          {
            where: { id: captionId },
          }
        )
        captionVotesBefore.push(incrementedCaptionVotesBefore[0][0][0].votes)
        const createdVote = await models.Vote.create(
          {
            userId: loggedInUserId,
            captionId,
            value: voteValue,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            returning: ["*"],
            fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
          }
        )
        createdVotes.push(createdVote)
      }
      const allVotesWhereCreated = createdVotes.every((vote) => {
        if (vote) return true
      })
      const config = structuredClone(setHeaders)
      config.data = { photoId }

      const { status, data } = await client.delete("/votes", config)

      const captionVotesAfter = []
      for (let i = 0; i < captionIds.length; i++) {
        const captionId = captionIds[parseInt(i)]

        const searchedCaptionVotesAfter = await models.Caption.findOne({
          where: { id: captionId },
        })
        captionVotesAfter.push(searchedCaptionVotesAfter.dataValues.votes)
      }
      const searchedVotesAfter = await models.Vote.findAll({
        where: { userId: loggedInUserId },
        attributes: ["value"],
      })
      const votesAfterDeleteAreNonexistent = searchedVotesAfter.every(
        (searchedVote) => {
          return searchedVote === null
        }
      )

      expect(allVotesWhereCreated).to.be.true
      expect(status).to.equal(OK)
      expect(data).to.equal(
        `User: ${loggedInUserId} has deleted ${captionIds.length} of their votes given photo id of ${photoId}.`
      )
      expect(allVotesWhereCreated).to.be.true
      expect(votesAfterDeleteAreNonexistent).to.be.true
      for (let i = 0; i < captionIds.length; i++) {
        expect(
          captionVotesBefore[parseInt(i)] - voteValues[parseInt(i)]
        ).to.equal(captionVotesAfter[parseInt(i)])
      }
    })
  })

  describe("Get /:captionId", function () {
    it("When user tries to get a non-existent vote, Then response is not found ", async function () {
      const captionId = 5

      const { status, data } = await client.get(
        "/votes/" + captionId,
        setHeaders
      )

      expect(status).to.equal(NOT_FOUND)
      expect(data).to.equal("Not found.")
    })

    it("When user tries to get an existent vote, Then repsonse is the vote data row ", async function () {
      const captionId = 5
      const voteValue = 1
      const incrementedCaptionVotesBefore = await models.Caption.increment(
        { votes: voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesBefore = incrementedCaptionVotesBefore[0][0][0].votes
      const createdVote = await models.Vote.create(
        {
          userId: loggedInUserId,
          captionId,
          value: voteValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          returning: ["*"],
          fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
        }
      )

      const { status, data: vote } = await client.get(
        "/votes/" + captionId,
        setHeaders
      )

      const incrementedCaptionVotesAfter = await models.Caption.increment(
        { votes: -voteValue },
        {
          where: { id: captionId },
        }
      )
      const captionsVotesAfter = incrementedCaptionVotesAfter[0][0][0].votes
      const deletedVote = await models.Vote.destroy({
        where: { captionId, userId: loggedInUserId },
      })

      expect(createdVote).to.exist
      expect(status).to.equal(OK)
      expect(vote).to.be.jsonSchema(voteSchema)
      expect(captionsVotesBefore - voteValue).to.equal(captionsVotesAfter)
      expect(deletedVote).to.equal(1)
    })
  })

  describe("Get /", function () {
    it("When user does not input values into request body, Then response is the user's 10 most recent updated votes", async function () {
      const expectedVotes = [
        {
          captionId: 6,
          userId: 3,
          value: 1,
          createdAt: "2023-11-04T20:08:00.000Z",
          updatedAt: "2023-11-04T20:08:00.000Z",
        },
        {
          captionId: 2,
          userId: 3,
          value: 1,
          createdAt: "2023-11-04T20:03:00.000Z",
          updatedAt: "2023-11-04T20:03:00.000Z",
        },
      ]
      const firstVoteDate = new Date(expectedVotes[0].updatedAt)
      const secondVoteDate = new Date(expectedVotes[1].updatedAt)

      const { status, data: votes } = await client.get(
        "/votes",
        setHeadersPreExisting
      )

      expect(status).to.equal(OK)
      expect(votes).to.be.jsonSchema(votesSchema)
      expect(votes).to.eql(expectedVotes)
      expect(firstVoteDate).to.be.afterTime(secondVoteDate)
    })

    it("When user inputs the allowed value, userId, into request body, Then response is the target user's 10 most recent updated votes", async function () {
      const expectedVotes = [
        {
          captionId: 2,
          userId: 1,
          value: -1,
          createdAt: "2023-11-04T20:02:00.000Z",
          updatedAt: "2023-11-04T20:02:00.000Z",
        },
        {
          captionId: 4,
          userId: 1,
          value: -1,
          createdAt: "2023-11-04T20:01:00.000Z",
          updatedAt: "2023-11-04T20:01:00.000Z",
        },
      ]
      const firstVoteDate = new Date(expectedVotes[0].updatedAt)
      const secondVoteDate = new Date(expectedVotes[1].updatedAt)
      const requestBody = { userId: 1 }
      const config = structuredClone(setHeadersPreExisting)
      config.data = requestBody

      const { status, data: votes } = await client.get("/votes", config)

      expect(status).to.equal(OK)
      expect(votes).to.be.jsonSchema(votesSchema)
      expect(votes).to.eql(expectedVotes)
      expect(firstVoteDate).to.be.afterTime(secondVoteDate)
    })
  })
})
