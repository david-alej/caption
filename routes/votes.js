const votesRouter = require("express").Router()
const { votesControllers } = require("../controllers/index")

votesRouter.param("captionId", votesControllers.paramVotes)

votesRouter.post("/:captionId", votesControllers.postVote)

votesRouter.put("/:captionId", votesControllers.putVote)

module.exports = votesRouter
