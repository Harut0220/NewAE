import { Router } from "express";
import meetingController from "../../../controllers/api/meeting/meetingController.js";
import { isEmpParamObjId } from "../../../middlewares/isEmpty.js";


const meetingRouter=Router()
meetingRouter.post("/notif/opportunity",meetingController.opportunity)
meetingRouter.post("/verify",meetingController.verify)
// meetingRouter.post("/admin/verify",meetingController.adminVerify)
// meetingRouter.post("/single/:id",meetingController.single)
meetingRouter.post("/add",meetingController.addMeeting)
meetingRouter.post("/add/participant",meetingController.addParticipant)
meetingRouter.put("/edit/:id",isEmpParamObjId,meetingController.editMeeting)
meetingRouter.get("/near/:id",isEmpParamObjId,meetingController.near)
meetingRouter.get("/single/:id",isEmpParamObjId,meetingController.single)
meetingRouter.post("/add/favorite",meetingController.addFavorit)
meetingRouter.post("/add/comment",meetingController.addComment)
meetingRouter.post("/add/rating",meetingController.addRating)
meetingRouter.post("/comment/like",meetingController.commentLike)
meetingRouter.post("/like",meetingController.like)
// meetingRouter.get("/page",meetingController.index)
meetingRouter.get("/myMeetings",meetingController.myMeeting)//kilometer success
meetingRouter.get("/allMeetings",meetingController.allMeeting)//kilometer success
meetingRouter.get("/meetings",meetingController.meetings)//kilometer success
meetingRouter.post("/participantSpot",meetingController.participantSpot)
meetingRouter.post("/comment/answer",meetingController.commentAnswer)
meetingRouter.post("/comment/answer/like",meetingController.commentAnswerLike)
meetingRouter.delete("/delete/comment",meetingController.deleteComment)
meetingRouter.delete("/delete/comment/answer",meetingController.deleteCommentAnswer)
meetingRouter.get("/my/participant",meetingController.myParticipant)



export default meetingRouter;