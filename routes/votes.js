const votesRouter = require("express").Router()
const { votesControllers } = require("../controllers/index")
const { votesValidator, getVotesValidator, integerValidator } =
  require("../controllers/index").validators

votesRouter.param("captionId", votesControllers.paramVotes)

votesRouter.post("/:captionId", votesValidator(), votesControllers.postVote)

votesRouter.put("/:captionId", votesValidator(), votesControllers.putVote)

votesRouter.delete("/:captionId", votesControllers.deleteVote)

votesRouter.delete(
  "/",
  integerValidator("photoId", false, true),
  votesControllers.deleteVotes
)

votesRouter.get("/:captionId", votesControllers.getVote)

votesRouter.get("/", getVotesValidator(), votesControllers.getVotes)

module.exports = votesRouter
