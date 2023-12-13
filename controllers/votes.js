const models = require("../database/models")
const { validationPerusal, integerValidator } = require("./validators")
const { Api400Error, Api404Error, Api500Error } =
  require("../util/index").apiErrors

const otherOptions = {
  order: [["updatedAt", "DESC"]],
  attributes: { exclude: ["id"] },
}

exports.paramVotes = async (req, res, next, captionId) => {
  const user = req.session.user
  req.captionId = captionId

  try {
    await integerValidator("captionId", true).run(req)

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
      ...otherOptions,
    })

    req.vote = null
    req.preVoteValue = null

    if (searchedVote) {
      req.vote = searchedVote.dataValues
      req.preVoteValue = req.vote.value

      req.vote.caption = searchedCaption.dataValues
    }

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
      otherOptions
    )

    if (!created) {
      await models.Caption.increment(
        { votes: -voteValue },
        {
          where: { id: captionId },
        }
      )

      throw new Api500Error(`User: ${user.id} create vote query did not work.`)
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
      throw new Api404Error(
        `User: ${user.id} has not voted for caption with id ${req.captionId} yet.`
      )
    }

    validationPerusal(req, `User: ${user.id}`)

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
      throw new Api500Error(
        `User: ${user.id} update increment query did not work.`
      )
    }

    const updated = await models.Vote.update(
      {
        value: voteValue,
      },
      {
        where: { captionId, userId: user.id },
        ...otherOptions,
      }
    )

    if (!updated) {
      await models.Caption.increment(
        { votes: -voteValue },
        {
          where: { id: captionId },
        }
      )

      throw new Api500Error(`User: ${user.id} update vote query did not work.`)
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
      throw new Api404Error(
        `User: ${user.id} cannot delete a vote that does not exist.`
      )
    }

    const voteValue = req.preVoteValue
    const captionId = parseInt(req.params.captionId)

    const incremented = await models.Caption.increment(
      { votes: -voteValue },
      {
        where: { id: captionId },
      }
    )

    if (!incremented) {
      throw new Api500Error(
        `User: ${user.id} deconstruct increment query did not work.`
      )
    }

    const deleted = await models.Vote.destroy({
      where: { captionId, userId: user.id },
    })

    if (!deleted) {
      await models.Caption.increment(
        { votes: voteValue },
        {
          where: { id: captionId },
        }
      )

      throw new Api500Error(`User: ${user.id} delete vote query did not work.`)
    }

    res.send(
      `User: ${user.id} has deleted their vote on caption id ${captionId} with vote value ${voteValue}`
    )
  } catch (err) {
    next(err)
  }
}

exports.deleteVotes = async (req, res, next) => {
  const user = req.session.user

  try {
    validationPerusal(req, `User: ${user.id}`)

    const { photoId } = req.body
    const whereUserId = { userId: user.id }
    const searchParams = { where: whereUserId, ...otherOptions }
    let afterMsg = "."

    if (photoId) {
      afterMsg = ` given photo id of ${photoId}.`

      searchParams.include = [
        {
          model: models.Caption,
          as: "caption",
          where: { photoId },
        },
      ]
    }

    const searchedVotes = await models.Vote.findAll(searchParams)

    if (!searchedVotes) {
      throw new Api500Error(
        `User: ${user.id} search votes query did not work` + afterMsg
      )
    }

    const votes = searchedVotes.map((vote) => vote.dataValues)
    let amountOfVotesDeleted

    for (let i = 0; i < votes.length; i++) {
      const vote = votes[parseInt(i)]
      const voteValue = vote.value
      const captionId = vote.captionId

      const incremented = await models.Caption.increment(
        { votes: -voteValue },
        {
          where: { id: captionId },
        }
      )

      if (!incremented) {
        throw new Api500Error(
          `User: ${user.id} deconstruct increment query did not work, only ${amountOfVotesDeleted} votes where deleted` +
            afterMsg
        )
      }

      const deleted = await models.Vote.destroy({
        where: { captionId, userId: user.id },
        ...otherOptions,
      })

      if (!deleted) {
        await models.Caption.increment(
          { votes: voteValue },
          {
            where: { id: captionId },
          }
        )

        throw new Api500Error(
          `User: ${user.id} delete vote query did not work, only ${amountOfVotesDeleted} votes where deleted` +
            afterMsg
        )
      }

      amountOfVotesDeleted = i + 1
    }

    res.send(
      `User: ${user.id} has deleted ${amountOfVotesDeleted} of their votes` +
        afterMsg
    )
  } catch (err) {
    next(err)
  }
}

exports.getVote = async (req, res, next) => {
  const user = req.session.user

  try {
    if (!req.vote) {
      throw new Api404Error(
        `User: ${user.id} cannot update a vote that does not exist.`
      )
    }

    res.json(req.vote)
  } catch (err) {
    next(err)
  }
}

exports.getVotes = async (req, res, next) => {
  const user = req.session.user
  const searchParams = {
    where: { userId: user.id },
    ...otherOptions,
    include: [
      {
        model: models.Caption,
        as: "caption",
      },
    ],
    limit: 10,
  }

  try {
    validationPerusal(req, `User: ${user.id}`)

    const { userId } = req.body

    if (userId) searchParams.where.userId = userId

    const searched = await models.Vote.findAll(searchParams)

    if (!searched) {
      throw new Api500Error(
        `User: ${user.id} search vote query did not work given user id of ${searchParams.where.userId}.`
      )
    }

    res.json(searched)
  } catch (err) {
    next(err)
  }
}
