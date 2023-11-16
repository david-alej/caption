const express = require("express")
const captionsRouter = express.Router()
const { captionsControllers } = require("../controllers/index")
const {
  integerValidator,
  textValidator,
  postCaptionsValidator,
  getCaptionsValidator,
  deleteCaptionsValidator,
} = require("../controllers/index").validators

captionsRouter.param(
  "captionId",
  integerValidator("captionId", true),
  captionsControllers.paramCaptionId
)

captionsRouter.post(
  "/",
  postCaptionsValidator(),
  captionsControllers.postCaption
)

captionsRouter.get("/", getCaptionsValidator(), captionsControllers.getCaptions)

captionsRouter.get("/:photoId", captionsControllers.getCaption)

captionsRouter.put(
  "/:photoId",
  textValidator("captionText"),
  captionsControllers.putCaption
)

captionsRouter.delete(
  "/",
  deleteCaptionsValidator(),
  captionsControllers.deleteCaptions
)

captionsRouter.delete("/:photoId", captionsControllers.deleteCaption)

module.exports = captionsRouter
