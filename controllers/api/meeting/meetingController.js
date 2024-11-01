import companyCategory from "../../../models/company/companyCategory.js";
import meetingService from "../../../services/MeetingService.js";
import NotificatationList from "../../../models/NotificationList.js";
import Notification from "../../../models/Notification.js";
import Role from "../../../models/Role.js";
import meetingVerify from "../../../models/meeting/meetingVerify.js";
import User from "../../../models/User.js";
import meetingModel from "../../../models/meeting/meetingModel.js";
import moment from "moment";
import notifEvent from "../../../events/NotificationEvent.js";
import MeetingParticipants from "../../../models/meeting/meetingParticipant.js";
import jwt from "jsonwebtoken";
import UserService from "../../../services/UserService.js";
import meetingFavorit from "../../../models/meeting/meetingFavorit.js";
import meetingComment from "../../../models/meeting/meetingComment.js";
import meetingImages from "../../../models/meeting/meetingImages.js";
import { stat } from "fs";

const meetingController = {
  myParticipant: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader !== "null") {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const result = await meetingService.myParticipant(user.id);
        if (result) {
          return res.status(200).send(result);
        } else {
          return res.status(404).send({ message: "Not found" });
        }
      } else {
        return res.status(403).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "An error occurred" });
    }
  },
  destroyVerify: async (req, res) => {
    const des_events = req.body.des_events;
    const result = await meetingService.destroyVerify(des_events);
    return res.redirect("back");
  },
  verifies: async (req, res) => {
    const result = await meetingVerify.find();
    const template = "profile/meetingVerify";
    return res.render(template, {
      layout: "profile",
      title: "Users Verify",
      user: req.user,
      meetings: result,
      q: req.query,
    });
  },
  destroy: async (req, res) => {
    const des_events = req.body.des_events;
    console.log("des_events", typeof des_events);
    console.log("des_events", des_events);

    const result = await meetingService.destroy(des_events);
    // const result="1"
    return res.redirect("back");
  },
  destroyImage: async (req, res) => {
    const image = await meetingImages.findById(req.params.id);
    console.log("image", image);
    console.log("image.meetingId", image.meetingId);

    const result = await meetingModel.findByIdAndUpdate(
      image.meetingId,
      { $pull: { images: image._id } },
      { new: true }
    );
    // console.log("result", result);
    await image.delete();
    console.log("deleted image");

    return res.redirect("back");
  },
  meetings: async (req, res) => {
    const authHeader = req.headers.authorization;

    const { lon, lan } = req.query;
    console.log("meeting req.query", req.query);
    console.log("meetings lon-", lon, "lan-", lan, "authHeader-", authHeader);

    // const user={id:"656ecb2e923c5a66768f4cd3"}
    const result = await meetingService.meetings(authHeader, lon, lan);
    return res.status(200).send(result);
  },
  deleteCommentAnswer: async (req, res) => {
    const { answerId } = req.body;
    const result = await meetingService.deleteCommentAnswer(answerId);
    return res.status(200).send(result);
  },
  commentAnswerLike: async (req, res) => {
    // const authHeader=req.headers.authorization
    // const token = authHeader.split(" ")[1];
    // const user = jwt.decode(token);
    const user = { id: "656ecb2e923c5a66768f4cd3" };
    const { answerId, commentId } = req.body;
    const result = await meetingService.commentAnswerLike(
      user.id,
      answerId,
      commentId
    );
    return res.status(200).send(result);
  },
  addRating: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    // const user={id:"656ecb2e923c5a66768f4cd5"}
    const { meetingId, rating } = req.body;
    const result = await meetingService.addRating(user.id, meetingId, rating);
    return res.status(200).send(result);
  },
  deleteComment: async (req, res) => {
    const { commentId } = req.body;
    const result = await meetingService.deleteComment(commentId);
    return res.status(200).send(result);
  },
  commentAnswer: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    // const user={id:"656ecb2e923c5a66768f4cd4"}

    const { commentId, text } = req.body;
    const result = await meetingService.commentAnswer(user.id, commentId, text);
    return res.status(200).send(result);
  },
  participantSpot: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    // const user={id:"656ecb2e923c5a66768f4cd3"}
    const { id } = req.body;
    const result = await meetingService.participantSpot(user.id, id);
    return res.status(200).send(result);
  },
  single: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    const id = req.params.id;
    const result = await meetingService.single(id, user.id);
    res.status(200).send({ message: "success", data: result });
  },
  myMeeting: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const result = await meetingService.myMeeting(authHeader);

      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  allMeeting: async (req, res) => {
    const authHeader = req.headers.authorization;
    const { lon, lat } = req.body;
    const result = await meetingService.allMeeting(authHeader, lon, lat);
    res.status(200).send(result);
  },
  meetShow: async (req, res) => {
    const id = req.params.id;
    const meeting = await meetingModel
      .findById(id)
      .populate("userId")
      .populate("images")
      .populate("participants");
    const template = "profile/meeting-show";
    // const updatedMeeting=await meetingModel.findById()
    const favorites = await meetingFavorit.find({
      userId: meeting.userId._id,
      meetingId: meeting.id,
    });
    const comments = await meetingComment
      .find({ meetingId: meeting.id })
      .populate("userId")
      .populate("likes");
    // console.log("meeting.participants", meeting.participants);
    console.log(meeting.status, "status");

    res.render(template, {
      layout: "profile",
      title: "Verification",
      user: req.user,
      event: meeting,
      images: meeting.images,
      paricipants: meeting.participants,
      paricipantsLength: meeting.participants.length,
      views: meeting.view,
      likes: meeting.likes.length,
      favorites: favorites.length,
      comments: comments,
      status: meeting.status,
    });
  },
  like: async (req, res) => {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];

    const user = jwt.decode(token);

    // const user = { id: "656ecb2e923c5a66768f4cd5" };
    const { id } = req.body;
    const result = await meetingService.like(user.id, id);
    res.status(200).send(result);
  },
  meetReject: async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      console.log("id", id, "status", data.status);

      const result = await meetingService.meetReject(id, data.status);
      const meetingDb = await meetingModel.findByIdAndUpdate(
        id,
        { $set: { statusMeeting: data.status } },
        { new: true }
      );

      console.log("meetingDb", meetingDb);

      res.redirect("back");
    } catch (error) {
      console.error(error);
    }
  },
  commentLike: async (req, res) => {
    try {
      // const authHeader = req.headers.authorization;

      // const token = authHeader.split(" ")[1];

      // const user = jwt.decode(token);

      const user = { id: "656ecb2e923c5a66768f4cd3" };
      const { id } = req.body;

      const result = await meetingService.commentLike(user.id, id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  reject: async (req, res) => {
    let status = req.body.status;
    let event = await meetingService.reject(req.params.id, { status });
    console.log("event", event);
    const userMeet = await User.findById(event.userId);
    const template = "profile/meeting-verify-rejected";
    res.render(template, {
      layout: "profile",
      title: "Verification",
      user: req.user,
      event: event,
      userMeet,
    });
    // return res.redirect("back");
  },
  show: async (req, res) => {
    try {
      const id = req.params.id;
      let template = "profile/meeting-single";
      const event = await meetingModel.findByIdAndUpdate(id,{$set:{status:1}}).populate("images");
      const user = await User.findById(event.userId);
      const urlPoint = { url: "http:/localhost:3000/" };
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }
      console.log("event.images", event.images);

      res.render(template, {
        layout: "profile",
        title: "Meeting Single",
        status: event.status,
        user: req.user,
        userMeet: user,
        event,
        images: event.images,
        participants: event.participants.length,
        favorit: event.favorites.length,
        urlPoint: "http:/localhost:3000/",
        likes: event.likes.length,
        view: event.view.length,
      });
      // const id = req.params.id;
      // console.log("id", id);
      // console.log(req.body);

      // const meeting = await meetingModel
      //   .findByIdAndUpdate(id, { $set: { status: 1 } }, { new: true })
      //   .populate("userId")
      //   .populate("images")
      //   .populate("participants");
      // const template = "profile/meeting-single";
      // // const updatedMeeting=await meetingModel.findById()
      // const favorites = await meetingFavorit.find({
      //   userId: meeting.userId,
      //   meetingId: meeting.id,
      // });
      // const comments = await meetingComment
      //   .find({ meetingId: meeting.id })
      //   .populate("userId")
      //   .populate("likes");
      // console.log("meeting.participants", meeting.participants);

      // res.render(template, {
      //   layout: "profile",
      //   title: "Verification",
      //   status: meeting.status,
      //   user: req.user,
      //   userMeet: meeting.userId,
      //   event: meeting,
      //   images: meeting.images,
      //   paricipants: meeting.participants.length,
      //   paricipantsLength: meeting.participants.length,
      //   view: meeting.view.length,
      //   likes: meeting.likes.length,
      //   favorite: favorites.length,
      //   // comments: comments,

      // });
      // res.render(template, {
      //   layout: "profile",
      //   title: "Meeting Single",
      //   status:event.status,
      //   user: req.user,
      //   userMeet: user,
      //   event,
      //   images: event.images,
      //   participants:event.participants.length,
      //   favorit:event.favorites.length,
      //   urlPoint: "http:/localhost:3000/",
      //   likes:event.likes.length,
      //   view:event.view.length
      // });
    } catch (error) {
      console.error(error);
    }
  },
  addComment: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);

      // const user = { id: "656ecb2e923c5a66768f4cd4" };

      const { meetingId, text } = req.body;
      const result = await meetingService.addComment(user.id, meetingId, text);
      console.log("result", result);

      res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  addFavorit: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const { id } = req.body;
      // const user = { id: "656ecb2e923c5a66768f4cd3" };

      const result = await meetingService.favorit(user.id, id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  near: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const id = req.params.id;
      // const user = { id: "656ecb2e923c5a66768f4cd3" };
      const result = await meetingService.near(id, user.id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  participantsPage: async (req, res) => {
    try {
      const id = req.params.id;
      let template = "profile/meeting-participants";
      const event = await meetingModel
        .findById(id)
        .populate("images")
        .populate("participants");
      // const user = await User.findById(event.userId);

      console.log(event.participants);

      res.render(template, {
        layout: "profile",
        title: "Participants",
        user: req.user,
        event: event.participants,
        // images: event.images,
      });
    } catch (error) {
      console.error(error);
    }
  },
  addParticipant: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader !== "null") {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);

        // const user = { id: "656ecb2e923c5a66768f4cd3" };
        const { id } = req.body;
        const result = await meetingService.addParticipant(user.id, id);
        console.log(result, "result");

        res.status(result.status).send({ message: result.message });
      } else {
        res.status(401).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(error);
    }
  },
  meetSingle: async (req, res) => {
    try {
      const id = req.params.id;
      let template = "profile/meeting-single";
      const event = await meetingModel.findById(id).populate("images");
      const user = await User.findById(event.userId);
      const urlPoint = { url: "http:/localhost:3000/" };
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }
      console.log("event.images", event.images);

      res.render(template, {
        layout: "profile",
        title: "Meeting Single",
        status: event.status,
        user: req.user,
        userMeet: user,
        event,
        images: event.images,
        participants: event.participants.length,
        favorit: event.favorites.length,
        urlPoint: "http:/localhost:3000/",
        likes: event.likes.length,
        view: event.view.length,
      });
    } catch (error) {
      console.error(error);
    }
  },
  resolve: async (req, res) => {
    try {
      const id = req.params.id;
      // const result = await meetingService.resolve(id);
      const resDb = await meetingVerify.findByIdAndUpdate(
        id,
        { $set: { status: 1 } },
        { new: true }
      );
      // const userDb = await User.findById(resDb.userId);
      const userDb = await User.findByIdAndUpdate(
        resDb.userId,
        { $set: { statusMeeting: "passed" } }, // Add the new meeting
        { new: true } // Return the updated document
      );
      let template = "profile/meeting-verify-page";

      if (userDb.id) {
        const store = async (data) => {
          let ex_notif_type = false;
          if (data.user && data.notif_type) {
            const user = await this.UserService.findAndLean(data.user);
            if (
              user &&
              user.list_of_notifications &&
              user.list_of_notifications.length
            ) {
              for (let l = 0; l < user.list_of_notifications.length; l++) {
                if (data.notif_type == user.list_of_notifications[l].name) {
                  ex_notif_type = true;
                  break;
                }
              }
            }
          }
          const getNotificatationListByName = async (name) => {
            return await NotificatationList.findOne({ name });
          };
          const notificationLists = await getNotificatationListByName(
            data.notif_type
          );

          if (!ex_notif_type && notificationLists) {
            return 1;
          }

          let roles = await Role.find({ name: data.sent }, { _id: 1 });
          data.sent = roles;
          return await Notification.create(data);
        };

        const db = await meetingVerify
          .findOne({
            userId: userDb.id,
          })
          .populate("userId");

        const evLink = `alleven://eventDetail/${db._id}`;
        await store({
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          user: userDb.id,
          type: "Новая встреча",
          message: `Ваше событие ${userDb.id} находится на модерации`,
          categoryIcon: "db.images[0]",
          event: db._id,
          link: evLink,
        });

        if (userDb.notifMeeting) {
          notifEvent.emit(
            "send",
            userDb._id,
            JSON.stringify({
              type: "Новая встреча",
              date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
              message: `${userDb.name} ${userDb.surname} поздравляем модерация прошла успешно. Вы можете организовать встречу`,
              link: evLink,
            })
          );
        }

        const pushInCollection = async (user_id, col_id, col_name) => {
          let user = await User.findById(user_id);
          user[col_name].push(col_id);
          user.last_event_date = moment
            .tz(process.env.TZ)
            .format("YYYY-MM-DD HH:mm");
          await user.save();
          return 1;
        };

        await pushInCollection(userDb.id, db._id, "events");

        // notifEvent.emit(
        //   "send",
        //   "ADMIN",
        //   JSON.stringify({
        //     type: "Новая встреча",
        //     message: "event",
        //     data: db,
        //   })
        // );

        // layout: "profile",
        // title: "Verification",
        // user: req.user,
        // userMeet: user,
        // event:meetVerify,
        res.render(template, {
          layout: "profile",
          title: "Meeting Single",
          userMeet: userDb,
          user: req.user,
          event: resDb,
        });
        // Send response and return early to prevent further execution
        // return res.status(200).send(result);
      } else {
        // User ID is not defined
        res.status(400).send({ message: "User not defined" });
      }
    } catch (error) {
      console.error(error);
    }
  },
  opportunity: async (req, res) => {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];

    const user = jwt.decode(token);

    const userDb = await User.findById(user.id);

    if (userDb.notifMeeting) {
      userDb.notifMeeting = false;
      await userDb.save();
    } else {
      userDb.notifMeeting = true;
      await userDb.save();
    }

    res.status(200).send({ message: "success" });
  },
  // single:async(req,res)=>{
  //   let template = "profile/meeting-single";
  //   let event = await this.EventService.getById(req.params.id);
  //   let eventCats = await this.EventCategoryService.get();
  //   if (event.status && event.status != 0 && event.status != 1) {
  //     template += "-rejected";
  //   }

  //   res.render(template, {
  //     layout: "profile",
  //     title: "Verification",
  //     user: req.user,
  //     event,
  //     eventCats,
  //   });
  // },
  verify: async (req, res) => {
    // try {
    //   const data = req.body;      // const authHeader = req.headers.authorization;
    //   // console.log(authHeader, "authHeader");
    //   // const token = authHeader.split(" ")[1];
    //   // const user = jwt.decode(token);
    //   const user={id:"656ecb2e923c5a66768f4cd3"}
    //   const userDb=await User.findById(user.id)
    //   if (!userDb.statusMeeting) {

    //   const result=await meetingService.verify(data,user.id)

    //   console.log(result);

    //   if (user.id) {
    //     console.log("mtav user.id block");

    //     // const result = await companyService.addCompany(data, user.id);
    //     const store = async (data) => {
    //       console.log(data,"data1");

    //       let ex_notif_type = true;
    //       if (data.user && data.notif_type) {
    //         console.log(data,"data2");
    //         const user = await this.UserService.findAndLean(data.user);
    //         console.log(data,"data3");
    //         if (
    //           user &&
    //           user.list_of_notifications &&
    //           user.list_of_notifications.length
    //         ) {
    //           console.log(data,"data4");
    //           for (let l = 0; l < user.list_of_notifications.length; l++) {
    //             if (data.notif_type == user.list_of_notifications[l].name) {
    //               ex_notif_type = true;
    //               break;
    //             }
    //           }
    //         }
    //       }
    //       const getNotificatationListByName = async (name) => {
    //         const getByName = async (name) => {
    //           return NotificatationList.findOne({ name });
    //         };
    //         return await getByName(name);
    //       };
    //       const notificationLists = await getNotificatationListByName(
    //         data.notif_type
    //       );

    //       if (!ex_notif_type && notificationLists) {
    //         return 1;
    //       }

    //       let roles = await Role.find({ name: data.sent }, { _id: 1 });
    //       data.sent = roles;
    //       return await Notification.create(data);
    //     };
    //     // console.log(result, "result");
    //     // if (result.company) {
    //       const db = await meetingVerify.findOne({
    //         userId:user.id,
    //       }).populate("userId");
    //       const evLink = `alleven://eventDetail/${db._id}`;
    //       await store({
    //         status: 2,
    //         date_time: new Date(),
    //         user: user.id,
    //         type: "message",
    //         message: `Ваше событие ${user.id} находится на модерации`,
    //         categoryIcon: "db.images[0]",
    //         event: db._id,
    //         link: evLink,
    //       });
    //       // const categor = await companyCategory.find({ _id: db.category });
    //       if(user.notifMeeting){
    //        notifEvent.emit(
    //         "send",
    //         userDb._id,
    //         JSON.stringify({
    //           type: "message",
    //           date_time: new Date(),
    //           message: `Ваше событие ${db.companyName} находится на модерации`,
    //           categoryIcon: categor.image,
    //           link: evLink,
    //         })
    //       );}

    //       const pushInCollection = async (user_id, col_id, col_name) => {
    //         let user = await User.findById(user_id);
    //         user[col_name].push(col_id);
    //         user.last_event_date = moment().format("YYYY-MM-DDTHH:mm");
    //         await user.save();
    //         return 1;
    //       };

    //       await pushInCollection(user.id, db._id, "events");

    //       // if(!result.message==="company exist"){

    //       notifEvent.emit(
    //         "send",
    //         "ADMIN",
    //         JSON.stringify({
    //           type: "Новая услуга",
    //           message: "event",
    //           data: db,
    //         })
    //       );
    //     // }
    //     res.status(200).send(result);
    //   } else {
    //     res.status(400).send({ message: "User not defined" });
    //   }
    //   res.status(200).send(result)
    // }else{
    //   res.status(200).send({message:"Ваши данные уже проверены"})
    // }

    // } catch (error) {
    //   console.error(error)
    // }
    try {
      const data = req.body;
      const authHeader = req.headers.authorization;
      console.log(authHeader, "authHeader");

      // const user = { id: "656ecb2e923c5a66768f4cd3" };

      if (authHeader&&authHeader!=="null") {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const userDb = await User.findById(user.id);
        userDb.statusMeeting = "inProgress";
        await userDb.save();
        const result = await meetingService.verify(data, user.id);
        const store = async (data) => {
          let ex_notif_type = false;
          if (data.user && data.type) {
            const findAndLean = async (id) => {
              return await User.findById(id)
                .select(["-password", "-block", "-fcm_token"])
                .populate([
                  "event_categories",
                  // "roles",
                  "event_favorite_categories",
                  "list_of_notifications",
                  // {
                  //   path: "meetings",
                  //   options: { sort: { createdAt: "desc" } },
                  //   populate: [
                  //     "images",
                  //     {
                  //       path: "category",
                  //       select: {
                  //         name: 1,
                  //         description: 1,
                  //         status: 1,
                  //         createdAt: 1,
                  //         updaedAt: 1,
                  //         avatar: 1,
                  //         map_avatar: 1,
                  //         categoryIcon: "$avatar",
                  //       },
                  //     },
                  //     {
                  //       path: "favorites",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "likes",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "participants",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "participantsSpot",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //   ],
                  // },
                  // {
                  //   path: "event_in_place",
                  //   options: { sort: { createdAt: "desc" } },
                  //   populate: [
                  //     "images",
                  //     {
                  //       path: "category",
                  //       select: {
                  //         name: 1,
                  //         description: 1,
                  //         status: 1,
                  //         createdAt: 1,
                  //         updaedAt: 1,
                  //         avatar: 1,
                  //         map_avatar: 1,
                  //         categoryIcon: "$avatar",
                  //       },
                  //     },
                  //     {
                  //       path: "favorites",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "likes",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "visits",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //     {
                  //       path: "in_place",
                  //       options: { sort: { createdAt: "desc" } },
                  //       select: [
                  //         "name",
                  //         "surname",
                  //         "email",
                  //         "phone_number",
                  //         "avatar",
                  //       ],
                  //     },
                  //   ],
                  // },
                ])
                .lean();
            };
            const user = await findAndLean(data.user);
            if (
              user &&
              user.list_of_notifications &&
              user.list_of_notifications.length
            ) {
              for (let l = 0; l < user.list_of_notifications.length; l++) {
                if (data.notif_type == user.list_of_notifications[l].name) {
                  ex_notif_type = true;
                  break;
                }
              }
            }
          }
          const getNotificatationListByName = async (name) => {
            return await NotificatationList.findOne({ name });
          };
          const notificationLists = await getNotificatationListByName(
            data.type
          );

          if (!ex_notif_type && notificationLists) {
            return 1;
          }

          let roles = await Role.find({ name: data.sent }, { _id: 1 });
          data.sent = roles;
          return await Notification.create(data);
        };

        const db = await meetingVerify
          .findOne({
            userId: user.id,
          })
          .populate("userId");

        const evLink = `alleven://eventDetail/${db._id}`;
        await store({
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          user: user.id,
          type: "Новая встреча",
          message: `Ваше событие ${user.id} находится на модерации`,
          categoryIcon: "db.images[0]",
          event: db._id,
          link: evLink,
        });
        if (userDb.notifMeeting) {
          if (userDb.notifMeeting) {
            notifEvent.emit(
              "send",
              userDb._id,
              JSON.stringify({
                type: "Новая встреча",
                date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
                message: `Ваше событие ${db.purpose} находится на модерации`,
                link: evLink,
              })
            );
          }
        }

        const pushInCollection = async (user_id, col_id, col_name) => {
          let user = await User.findById(user_id);
          user[col_name].push(col_id);
          user.last_event_date = moment
            .tz(process.env.TZ)
            .format("YYYY-MM-DD HH:mm");
          await user.save();
          return 1;
        };

        await pushInCollection(user.id, db._id, "events");

        notifEvent.emit(
          "send",
          "ADMIN",
          JSON.stringify({
            type: "Новая встреча",
            message: "event",
            data: db,
          })
        );

        // Send response and return early to prevent further execution
        console.log("result", result);

        return res.status(200).send(result);
      } else {
        // User ID is not defined
        return res.status(400).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "An error occurred" });
    }
  },
  // adminVerify:async(req,res)=>{

  // },
  addMeeting: async (req, res) => {
    try {
      const meeting = req.body;
      console.log("meeting.date", meeting.date);
      console.log("meeting", meeting);

      const authHeader = req.headers.authorization;
      if(authHeader&&authHeader!=="null"){
        console.log(authHeader, "authHeader");
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        // const user = { id: "656ecb2e923c5a66768f4cd3" };
        const phone = user.phone_number;
        const userDb = await User.findById(user.id);
        if (userDb.statusMeeting) {
          const result = await meetingService.addMeeting(meeting, user.id, phone);
          res.status(200).send(result);
        } else {
          res.status(400).send({ message: "пройти паспортную проверку" });
        }
      }else{
        res.status(400).send({ message: "Unauthorized" });
      }

    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "An error occurred" });
    }
  },
  editMeeting: async (req, res) => {
    try {
      const id = req.params.id;
      const meeting = req.body;
      const result = await meetingService.editMeeting(id, meeting);
      if (!result) {
        res.status(400).send({ message: "Event not found" });
      }
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "An error occurred" });
    }
  },
  index: async (req, res) => {
    const { name, category, date_from } = req.query;
    let params = {};
    if (name) {
      params.name = name;
    }

    if (category) {
      params.category = category;
    }

    if (date_from) {
      params.started_time = {
        $gte: new Date(date_from).toISOString(),
      };
    }
    let eventCats = [];
    // const events=await companyModel.find()
    const meetings = await meetingModel.find().populate("userId");
    function separateUpcomingAndPassed(meetings) {
      const upcoming = [];
      const passed = [];

      meetings.forEach((meeting) => {
        // console.log(meeting.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),"meeting.date > moment.tz(process.env.TZ).format(YYYY-MM-DD HH:mm)");

        if (
          meeting.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
        ) {
          upcoming.push(meeting);
        } else {
          passed.push(meeting);
        }
      });

      return { upcoming, passed };
    }
    const separatedEvents = separateUpcomingAndPassed(meetings);

    for (let i = 0; i < separatedEvents.passed.length; i++) {
      await meetingModel.findByIdAndUpdate(
        separatedEvents.passed[i]._id,
        { $set: { situation: "passed" } },
        { new: true }
      );
    }
    const meetingsRes = await meetingModel.find().populate("userId");

    console.log("req.query", req.query);

    res.render("profile/meeting", {
      layout: "profile",
      title: "Meeting",
      user: req.user,
      meetings: meetingsRes,
      q: req.query,
    });
  },
};

export default meetingController;
