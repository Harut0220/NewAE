import { Router } from "express";
import EventController from "../../../controllers/api/event/EventController.js";
import EventCategoryController from "../../../controllers/api/event/EventCategoryController.js";
import FavoriteController from "../../../controllers/api/event/FavoriteController.js";
import VisitController from "../../../controllers/api/event/VisitController.js";
import LikeController from "../../../controllers/api/event/LikeController.js";
import ViewController from "../../../controllers/api/event/ViewController.js";
import { eventCategory, event, likeDislike, rating, comment, commentLike, ImpressionImage, userImpression, nearEvent } from "../../../middlewares/validate/api/event.js";
import RatingController from "../../../controllers/api/event/RatingController.js";
import CommentController from "../../../controllers/api/event/CommentController.js";
import EventImpressionImageController from "../../../controllers/api/event/EventImpressionImageController.js"
import InPlaceController from "../../../controllers/api/event/InPlaceController.js";
import { empObj, isEmpParamObjId } from "../../../middlewares/isEmpty.js";
import authenticateJWT from "../../../middlewares/authJWT.js";
import authenticateJWTWithoutCheck from "../../../middlewares/authJWTwithoutCheck.js";

const 
eventRoutes = Router();

eventRoutes.post("/notif/opportunity",EventController.opportunity)
//authenticateJWTWithoutCheck,
eventRoutes.get('/',authenticateJWTWithoutCheck,EventController.index);

eventRoutes.get("/single/:id",isEmpParamObjId,EventController.single);


eventRoutes.post('/store',EventController.store);

eventRoutes.post("/add/participant",EventController.addParticipant)

eventRoutes.post("/add/participant/spot",EventController.addParticipantSpot)

eventRoutes.put("/edit/:id",isEmpParamObjId,empObj,EventController.edit);

eventRoutes.get("/near/:id",isEmpParamObjId,EventController.nearEvent);

eventRoutes.post("/favorite",FavoriteController.favorite);

eventRoutes.post("/like",LikeController.like);
///////////////////////////////////minchev stex
eventRoutes.post("/add/comment",CommentController.addComment);

eventRoutes.delete("/comment/delete",CommentController.deleteComment);

eventRoutes.post("/comment/like",CommentController.commentLike);

eventRoutes.post("/comment/answer",CommentController.commentAnswer);

eventRoutes.delete("/comment/answer/delete",CommentController.deleteCommentAnswer);

eventRoutes.post("/comment/answer/like",CommentController.commentAnswerLike);

eventRoutes.post("/add/rating",RatingController.addRating);

eventRoutes.get("/events",EventController.upcoming)//kilometr motikic heru

eventRoutes.get("/allEvent",EventController.allEvent)//kilometr motikic heru

eventRoutes.get("/allFilter",EventController.allFilter)//shatic qich

eventRoutes.get("/radius",EventController.radius)//kilometr motikic heru

eventRoutes.get("/my/events",EventController.myEvents)

eventRoutes.get("/my/participant",EventController.myParticipant)//kilometr motikic heru

eventRoutes.post("/socketTest",EventController.socket)

// eventRoutes.get("/test/upcoming",EventController.testUpcoming)



/////////////////////////////////////////
//nearEvent,
// eventRoutes.get('/near/:id',EventController.nearEvent);
// //authenticateJWT,
// eventRoutes.put('/edit/:id',empObj,authenticateJWT,EventController.edit);
// //authenticateJWTWithoutCheck,
// eventRoutes.get('/categories',authenticateJWTWithoutCheck,EventCategoryController.index);
// //authenticateJWT,eventCategory,
eventRoutes.post('/category/store',EventCategoryController.store);
// //authenticateJWT,likeDislike,
// eventRoutes.post('/like',authenticateJWT,likeDislike,LikeController.store);
// //authenticateJWT,
// eventRoutes.get('/like',authenticateJWT,LikeController.index);
// //authenticateJWT,
// eventRoutes.post('/favorite',authenticateJWT,likeDislike,FavoriteController.store);
// //authenticateJWT,
// eventRoutes.get('/favorite',FavoriteController.index);
// //authenticateJWT,
// eventRoutes.post('/visit',likeDislike,VisitController.store);
// //authenticateJWT,
// eventRoutes.get('/visit',VisitController.index);
// //authenticateJWT,
// eventRoutes.post('/view',authenticateJWT,likeDislike,ViewController.store);
// //authenticateJWT,
// eventRoutes.get('/in_place',authenticateJWT,InPlaceController.index);//spotPartisipant
// //authenticateJWT,
// eventRoutes.post('/in_place',authenticateJWT,likeDislike,InPlaceController.store);//spot participant
// //authenticateJWT,
// eventRoutes.post('/rating/store',authenticateJWT,rating,RatingController.store);
// //authenticateJWT,
// eventRoutes.post('/comment/store',comment,CommentController.store);

// eventRoutes.get('/comment/get',CommentController.index);
// //authenticateJWT,
// eventRoutes.post('/comment/like/store',authenticateJWT,commentLike,CommentController.like);
// //authenticateJWT,
eventRoutes.post('/impression-images/store',authenticateJWT,ImpressionImage,EventImpressionImageController.store);
// //userImpression,
// eventRoutes.get('/user/impressions',userImpression,EventController.userImpressions)
// //authenticateJWT,
// eventRoutes.get('/impressions',authenticateJWT, EventController.eventImpressions)

// eventRoutes.get("/my/events",EventController.myEventList)

// eventRoutes.get('/single/:id',EventController.single);
//authenticateJWT

export {eventRoutes}
