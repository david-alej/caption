const express = require("express")
const captionsRouter = express.Router()
const { captionsControllers } = require("../controllers/index")
const {
  textValidator,
  postCaptionsValidator,
  getCaptionsValidator,
  deleteCaptionsValidator,
} = require("../controllers/index").validators

captionsRouter.param("captionId", captionsControllers.paramCaptionId)

captionsRouter.post(
  "/",
  postCaptionsValidator(),
  captionsControllers.postCaption
)

captionsRouter.get("/", getCaptionsValidator(), captionsControllers.getCaptions)

captionsRouter.get("/:captionId", captionsControllers.getCaption)

captionsRouter.put(
  "/:captionId",
  textValidator("text"),
  captionsControllers.putCaption
)

captionsRouter.delete(
  "/",
  deleteCaptionsValidator(),
  captionsControllers.deleteCaptions
)

captionsRouter.delete("/:captionId", captionsControllers.deleteCaption)

module.exports = captionsRouter
