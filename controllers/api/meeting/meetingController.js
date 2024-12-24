import meetingService from "../../../services/MeetingService.js";
import Notification from "../../../models/Notification.js";
import meetingVerify from "../../../models/meeting/meetingVerify.js";
import User from "../../../models/User.js";
import meetingModel from "../../../models/meeting/meetingModel.js";
import moment from "moment";
import notifEvent from "../../../events/NotificationEvent.js";
import jwt from "jsonwebtoken";
import meetingFavorit from "../../../models/meeting/meetingFavorit.js";
import meetingComment from "../../../models/meeting/meetingComment.js";
import meetingImages from "../../../models/meeting/meetingImages.js";
import schedule from "node-schedule";
import meetingImpressionImage from "../../../models/meeting/meetingImpressionImage.js";

const meetingController = {
  impressionImagesStore: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const { meeting_id, files } = req.body;
      const serviceFunction = async () => {
        const meetingImpressionImageDb = await meetingImpressionImage
          .findOne({ meeting: meeting_id, user: user.id })
          .populate({ path: "user", select: "name surname avatar" });
        if (!meetingImpressionImageDb) {
          const resultDb = new meetingImpressionImage({
            user: user.id,
            meeting: meeting_id,
            path: files,
          });
          await resultDb.save();
          await meetingModel.findByIdAndUpdate(meeting_id, {
            $push: { impression_images: resultDb._id },
          });
          const result = await meetingImpressionImage
            .findById(resultDb._id)
            .populate({ path: "user", select: "name surname avatar" });
          return { result, bool: false };
        } else {
          for (let i = 0; i < files.length; i++) {
            meetingImpressionImageDb.path.push(files[i]);
            await meetingImpressionImageDb.save();
          }
          const result = await meetingImpressionImage
            .findById(meetingImpressionImageDb._id)
            .populate({ path: "user", select: "name surname avatar" });
          return { result, bool: true };
        }
      };

      const result = await serviceFunction();
      const data = await meetingImpressionImage
        .findById(result.result._id)
        .populate({ path: "user", select: "name surname avatar" });

      const meetingDb = await meetingModel
        .findById(meeting_id)
        .populate({ path: "user", select: "_id notifMeeting" });
      const evLink = `alleven://meetingDetail/${meeting_id}`;

      const dataNotif = {
        status: 2,
        date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        user: meetingDb.user._id.toString(),
        type: "impression",
        message: `Пользователь ${user.name} поделился впечатлением о встрече ${meetingDb.name}.`,
        meeting: meeting_id,
        link: evLink,
      };
      const nt = new Notification(dataNotif);
      await nt.save();
      if (meetingDb.user.notifMeeting) {
        notifEvent.emit(
          "send",
          meetingDb.user._id.toString(),
          JSON.stringify({
            type: "impression",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
            message: `Пользователь ${user.name} поделился впечатлением о встрече ${meetingDb.name}.`,
            categoryIcon: meetingDb.category.avatar, //sarqel
            link: evLink,
          })
        );
      }

      return res
        .status(200)
        .send({ updated: result.bool, success: true, data: result.result });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "An error occurred" });
    }
  },
  myParticipant: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const result = await meetingService.myParticipant(user.id);
      if (result) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({ message: "Not found" });
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
  

    const result = await meetingService.destroy(des_events);
    return res.redirect("back");
  },
  destroyImage: async (req, res) => {
    const image = await meetingImages.findById(req.params.id);
 

    const result = await meetingModel.findByIdAndUpdate(
      image.meetingId,
      { $pull: { images: image._id } },
      { new: true }
    );
    await image.delete();

    return res.redirect("back");
  },
  meetings: async (req, res) => {
    const authHeader = req.headers.authorization;

    const { longitude, latitude } = req.query;

    const result = await meetingService.meetings(
      authHeader,
      longitude,
      latitude
    );
    return res.status(200).send(result);
  },
  deleteCommentAnswer: async (req, res) => {
    const { answerId } = req.body;
    const result = await meetingService.deleteCommentAnswer(answerId);
    return res.status(200).send(result);
  },
  commentAnswerLike: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    // const user = { id: "656ecb2e923c5a66768f4cd3" };
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

      res.status(200).send(result);
    } catch (error) {
      console.error(error);
    }
  },
  allMeeting: async (req, res) => {
    const authHeader = req.headers.authorization;
    const { longitude, latitude } = req.body;
    const result = await meetingService.allMeeting(
      authHeader,
      longitude,
      latitude
    );
    res.status(200).send(result);
  },
  meetShow: async (req, res) => {
    const id = req.params.id;
    const meeting = await meetingModel
      .findById(id)
      .populate({ path: "user", select: "-password" })
      .populate("images")
      .populate("participants");
    const template = "profile/meeting-show";
    const favorites = await meetingFavorit.find({
      user: meeting.user._id,
      meetingId: meeting.id,
    });
    const comments = await meetingComment
      .find({ meetingId: meeting.id })
      .populate({ path: "user", select: "-password" })
      .populate("likes");

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

    const { id } = req.body;
    const result = await meetingService.like(user.id, id);
    res.status(200).send(result);
  },
  meetReject: async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;

      const result = await meetingService.meetReject(id, data.status);
      const meetingDb = await meetingModel.findByIdAndUpdate(
        id,
        { $set: { statusMeeting: data.status } },
        { new: true }
      );


      res.redirect("back");
    } catch (error) {
      console.error(error);
    }
  },
  commentLike: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);

      // const user = { id: "656ecb2e923c5a66768f4cd3" };
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
    const userMeet = await User.findById(event.user);
    const template = "profile/meeting-verify-rejected";

    // const evLink = `alleven://eventDetail/${event_id}`;
    // notifEvent.emit(
    //   "send",
    //   registerDb.user._id.toString(),
    //   JSON.stringify({
    //     type: "message",
    //     date_time: moment
    //       .tz(process.env.TZ)
    //       .format("YYYY-MM-DD HH:mm"),
    //     message: `Вы записались на услугу ${registerDb.serviceId.type} сегодня в ${registerDb.date}`,
    //     // categoryIcon: eventDb.category.avatar,//sarqel
    //     link: evLink,
    //   })
    // );

    localhost: 3000;
    res.render(template, {
      layout: "profile",
      title: "Verification",
      user: req.user,
      event,
      userMeet,
    });
  },
  edite: async (req, res) => {
    try {
      const id = req.params.id;
      const event = await meetingModel.findById(id);
      res.render("profile/meeting-edit", {
        layout: "profile",
        title: "Meeting Edit",
        event,
      });
    } catch (error) {
      console.error(error);
    }
  },
  show: async (req, res) => {
    try {
      let data = req.body;

      const id = req.params.id;
      let template = "profile/meeting-single";
      const event = await meetingModel
        .findByIdAndUpdate(id, { $set: { status: 1 } })
        .populate("images");
      const user = await User.findById(event.user);
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }
      if (data.date || data.address || data.purpose || data.description) {
        const editMeet = await meetingModel.findById(id);
        editMeet.purpose = data.purpose;
        editMeet.description = data.description;
        editMeet.address = data.address;
        editMeet.date = data.date;
        await editMeet.save();
      }

      // res.render(template, {
      //   layout: "profile",
      //   title: "Meeting Single",
      //   status: event.status,
      //   user: req.user,
      //   userMeet: user,
      //   event,
      //   images: event.images,
      //   participants: event.participants.length,
      //   favorit: event.favorites.length,
      //   urlPoint: "http:/localhost:3000/",
      //   likes: event.likes.length,
      //   view: event.view.length,
      // });
      res.redirect("back");
    } catch (error) {
      console.error(error);
    }
  },
  addComment: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);


      const { meetingId, text } = req.body;
      const result = await meetingService.addComment(user.id, meetingId, text);

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
      const id = req.params.id;

      const result = await meetingService.near(id, authHeader);
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
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);

      // const user = { id: "656ecb2e923c5a66768f4cd3" };
      const { id } = req.body;
      const result = await meetingService.addParticipant(user.id, id);

      res.status(result.status).send({ message: result.message });
    } catch (error) {
      console.error(error);
    }
  },
  meetSingle: async (req, res) => {
    try {
      const id = req.params.id;
      let template = "profile/meeting-single";
      const event = await meetingModel.findById(id).populate("images");
      const user = await User.findById(event.user);
      const urlPoint = { url: "http:/localhost:3000/" };
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }

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
      const resDb = await meetingVerify.findByIdAndUpdate(
        id,
        { $set: { status: 1 } },
        { new: true }
      );
      const userDb = await User.findByIdAndUpdate(
        resDb.user,
        { $set: { statusMeeting: "Verified" } },
        { new: true }
      );
      let template = "profile/meeting-verify-page";

      if (userDb.id) {
        const db = await meetingVerify
          .findOne({
            user: userDb._id.toString(),
          })
          .populate({ path: "user", select: "-password" });

        const dataNotif = {
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          user: userDb._id.toString(),
          type: "confirm_passport",
          message: `Ваша личность успешно подтверждена. Теперь вы можете создавать встречи.`,
        };
        const nt = new Notification(dataNotif);
        await nt.save();
        notifEvent.emit(
          "send",
          userDb._id.toString(),
          JSON.stringify({
            type: "confirm_passport",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
            message: `Ваша личность успешно подтверждена. Теперь вы можете создавать встречи.`,
          })
        );

        res.render(template, {
          layout: "profile",
          title: "Meeting Single",
          userMeet: userDb,
          user: req.user,
          event: resDb,
        });
      } else {
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
    try {
      const data = req.body;
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);

      const result = await meetingService.verify(data, user.id);
      const userDb = await User.findById(user.id);
      if (userDb.statusMeeting === "Verified") {
        return res
          .status(200)
          .send({ message: "success", data: "Вы уже прошли модерацию " });
      } else if (userDb.statusMeeting === "inProgress") {
        return res.status(200).send({
          message: "success",
          data: "Вы уже прошли модерацию подаждите подвердение",
        });
      }
      userDb.statusMeeting = "inProgress";
      await userDb.save();

      const db = await meetingVerify
        .findOne({
          user: user.id,
        })
        .populate({ path: "user", select: "-password -fcm_token" });

      const evLink = `alleven://eventDetail/${db._id}`;

      notifEvent.emit(
        "send",
        "ADMIN",
        JSON.stringify({
          type: "Новая встреча",
          message: "event",
          data: db,
        })
      );

      return res.status(200).send(result);
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
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);

      const userDb = await User.findById(user.id);
      const phone = userDb.phone_number;
      if (userDb.statusMeeting === "Verified") {
        const result = await meetingService.addMeeting(meeting, user.id, phone);
        const dat = result[1].date + ":00";

        const eventTime = moment.tz(dat, process.env.TZ);

        const notificationTime = eventTime.clone().subtract(1, "hour");
  

        const currentTime = moment.tz(process.env.TZ).format();
  

        async function sendMessage(idMeet) {
          const meetingDb = await meetingModel
            .findById(idMeet)
            .populate({
              path: "participants",
              populate: { path: "user", select: "_id fcm_token" },
            })
            .populate("participantSpot")
            .exec();
          if (meetingDb) {
            for (let i = 0; i < meetingDb.participants.length; i++) {
              const element = meetingDb.participants[i].user;
              if (element.fcm_token[0]) {
                const evLink = `alleven://meetingDetail/${meetingDb._id}`;
                const dataNotif = {
                  status: 2,
                  date_time: new Date(),
                  user: element._id.toString(),
                  type: "participation",
                  message: `Ваше событие ${d.name} находится на модерации`,
                  // categoryIcon: category.avatar,
                  meeting: meetingDb._id,
                  link: evLink,
                };
                const nt = new Notification(dataNotif);
                await nt.save();
                console.log(
                  `Встреча ${meetingDb.purpose} начнется через час. Не пропустите.`
                );
                if (userDb.notifMeeting) {
                  notifEvent.emit(
                    "send",
                    element._id,
                    JSON.stringify({
                      type: "participation",
                      date_time: moment
                        .tz(process.env.TZ)
                        .format("YYYY-MM-DD HH:mm"),
                      message: `Встреча ${meetingDb.purpose} начнется через час. Не пропустите.`,
                      // categoryIcon: meetingDb.category.avatar,//sarqel
                      link: evLink,
                    })
                  );
                }
              }
            }
          }
        }

        schedule.scheduleJob(notificationTime.toDate(), () => {
          sendMessage(result[1]._id.toString());
        });
        async function sendEventMessage(idMeetSpot) {
          const meetingDb = await meetingModel
            .findById(idMeetSpot)
            .populate({
              path: "participantSpot",
              populate: { path: "user", select: "_id fcm_token" },
            })
            .exec();
          if (meetingDb) {


            for (let i = 0; i < meetingDb.participantSpot.length; i++) {
              const element = meetingDb.participantSpot[i].user;
              if (element.fcm_token[0]) {
                const evLink = `alleven://meetingDetail/${meetingDb._id}`;
                const dataNotif = {
                  status: 2,
                  date_time: moment
                    .tz(process.env.TZ)
                    .format("YYYY-MM-DD HH:mm"),
                  user: element._id.toString(),
                  type: "participationSpot",
                  message: `Ваше событие ${d.name} находится на модерации`,
                  // categoryIcon: category.avatar,
                  meeting: meetingDb._id,
                  link: evLink,
                };
                const nt = new Notification(dataNotif);
                await nt.save();
                console.log(`Встреча ${meetingDb.purpose} началось.`);

                notifEvent.emit(
                  "send",
                  element._id.toString(),
                  JSON.stringify({
                    type: "participationSpot",
                    date_time: moment
                      .tz(process.env.TZ)
                      .format("YYYY-MM-DD HH:mm"),
                    message: `Встреча ${meetingDb.purpose} началось.`,
                    // categoryIcon: meetingDb.category.avatar,//sarqel
                    link: evLink,
                  })
                );
              }
            }
          }
        }
        schedule.scheduleJob(eventTime.toDate(), () => {
          sendEventMessage(result[1]._id.toString());
        });

        res.status(200).send(result[0]);
      } else {
        res.status(400).send({ message: "пройти паспортную проверку" });
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
    const { name, date_from } = req.query;
    let params = {};

    let eventCats = [];
    const meetings = await meetingModel
      .find()
      .sort({ createdAt: "desc" })
      .populate("user");
    function separateUpcomingAndPassed(meetings) {
      const upcoming = [];
      const passed = [];

      meetings.forEach((meeting) => {
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
    let meetingsRes;
    if (name && date_from) {
      params.purpose = name;
      if (date_from) {
        params.date = {
          $gte: new Date(date_from).toISOString(),
        };
      }
      meetingsRes = await meetingModel.find(params).populate("user");
      // params.name = name;
      // params.date_from = date_from;
    }

    if (name) {
      meetingsRes = await meetingModel
        .find({ purpose: name })
        .populate({ path: "user", select: "-password" });
      params.name = name;
    }

    if (date_from) {
      if (date_from) {
        params.date = {
          $gte: new Date(date_from).toISOString(),
        };
      }
      meetingsRes = await meetingModel
        .find(params)
        .populate({ path: "user", select: "-password" });

      // params.started_time = {
      //   $gte: new Date(date_from).toISOString(),
      // };
    }

    if (!name && !date_from) {
      meetingsRes = await meetingModel
        .find()
        .populate({ path: "user", select: "-password" });
    }


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
