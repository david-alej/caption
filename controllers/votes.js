const models = require("../database/models")
const {
  validationPerusal,
  integerValidator,
  incrementValidator,
} = require("./validators")
const { Api400Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

exports.paramVotes = async (req, res, next, captionId) => {
  const user = req.session.user
  req.captionId = captionId

  try {
    await integerValidator("captionId", true).run(req)
    await incrementValidator("voteValue").run(req)

    validationPerusal(req, `User: ${user.id}`)

    const searchedCaption = await models.Caption.findOne({
      where: { id: captionId },
    })

    if (!searchedCaption) {
      throw new Api404Error(
        `User: ${user.id} caption was not found given caption id ${captionId}.`
      )
    }

    const searchedVote = await models.Vote.findOne({
      where: {
        userId: user.id,
        captionId: captionId,
      },
      attributes: ["value"],
    })

    req.preVoteValue = searchedVote ? searchedVote.dataValues.value : undefined

    next()
  } catch (err) {
    next(err)
  }
}

exports.postVote = async (req, res, next) => {
  const user = req.session.user

  try {
    if (req.preVoteValue) {
      throw new Api400Error(
        `User: ${user.id} already has voted for caption with id ${req.captionId}`
      )
    }

    validationPerusal(req, `User: ${user.id}`)

    const { voteValue } = req.body
    const captionId = parseInt(req.params.captionId)

    const incremented = await models.Caption.increment(
      { votes: voteValue },
      {
        where: { id: captionId },
      }
    )

    if (!incremented) {
      throw new Api500Error(`User: ${user.id} increment query did not work.`)
    }

    const created = await models.Vote.create(
      {
        userId: user.id,
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

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    res
      .status(201)
      .send(`User: ${user.id} has voted ${voteValue} on caption ${captionId}.`)
  } catch (err) {
    next(err)
  }
}

exports.putVote = async (req, res, next) => {
  const user = req.session.user

  try {
    if (!req.preVoteValue) {
      throw new Api400Error(
        `User: ${user.id} has not voted for caption with id ${req.captionId} yet.`
      )
    }
    const { voteValue } = req.body
    const captionId = parseInt(req.params.captionId)

    if (voteValue === req.preVoteValue) {
      throw new Api400Error(
        `User: ${user.id} already has the same vote on the caption with caption id ${captionId}`
      )
    }

    const incremented = await models.Caption.increment(
      { votes: voteValue },
      {
        where: { id: captionId },
      }
    )

    if (!incremented) {
      throw new Api500Error(`User: ${user.id} increment query did not work.`)
    }

    const created = await models.Vote.update(
      {
        value: voteValue,
      },
      {
        where: { captionId, userId: user.id },
        returning: ["*"],
        fields: ["userId", "captionId", "value", "createdAt", "updatedAt"],
      }
    )

    if (!created) {
      throw new Api500Error(`User: ${user.id} create query did not work.`)
    }

    res.send(
      `User: ${user.id} has updated their vote on caption id ${captionId} with vote value ${voteValue}`
    )
  } catch (err) {
    next(err)
  }
}

exports.deleteVote = async (req, res, next) => {
  const user = req.session.user

  try {
    if (!req.preVoteValue) {
      throw new Api400Error(
        `User: ${user.id} cannot delete a vote that does not exist.`
      )
    }
  } catch (err) {
    next(err)
  }
}
