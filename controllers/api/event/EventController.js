import EventService from "../../../services/EventService.js";
import ImpressionService from "../../../services/ImpressionService.js";
import notifEvent from "../../../events/NotificationEvent.js";
import EventRatingService from "../../../services/EventRatingService.js";
import CalculateTheDistance from "../../../services/CalculateTheDistance.js";
import UserService from "../../../services/UserService.js";
import Event from "../../../models/event/Event.js";
import EventCategory from "../../../models/event/EventCategory.js";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
import EventParticipants from "../../../models/event/EventParticipants.js";
import EventView from "../../../models/event/EventView.js";
import EventParticipantsSpot from "../../../models/event/EventParticipantsSpot.js";
import EventLike from "../../../models/event/EventLike.js";
import EventFavorites from "../../../models/event/EventFavorites.js";
import moment from "moment";
import EventRating from "../../../models/event/EventRating.js";
import EventCommentAnswerLike from "../../../models/event/EventCommentAnswerLike.js";
import EventCommentLikes from "../../../models/event/EventCommentLikes.js";
import schedule from "node-schedule";
import eventImpressionImages from "../../../models/event/EventImpressionImages.js";
import Notification from "../../../models/Notification.js";
class EventController {
  constructor() {
    this.EventService = new EventService();
    this.ImpressionService = new ImpressionService();
    this.EventRatingService = new EventRatingService();
    this.CalculateTheDistance = new CalculateTheDistance();
    this.UserService = new UserService();
  }

  ImpressionImage = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    const { event_id, files } = req.body;

    const serviceFunction = async () => {
      const companyImpressionImagesDb = await eventImpressionImages
        .findOne({ event: event_id, user: user.id })
        .populate({ path: "user", select: "name surname avatar" });
      if (!companyImpressionImagesDb) {
        const resultDb = new eventImpressionImages({
          path: files,
          user: user.id,
          event: event_id,
        });
        await resultDb.save();
        await Event.findByIdAndUpdate(event_id, {
          $push: { impression_images: resultDb._id },
        });
        const result = await eventImpressionImages
          .findById(resultDb._id)
          .populate({ path: "user", select: "name surname avatar" });

        return { result, bool: false };
      } else {
        for (let i = 0; i < files.length; i++) {
          companyImpressionImagesDb.path.push(files[i]);
          await companyImpressionImagesDb.save();
        }
        const result = await eventImpressionImages
          .findById(companyImpressionImagesDb._id)
          .populate({ path: "user", select: "name surname avatar" });
        return { result, bool: true };
      }
    };
    const result = await serviceFunction();
    const data = await eventImpressionImages
      .findById(result.result._id)
      .populate({ path: "user", select: "name surname avatar" });

    const eventDb = await Event.findById(event_id)
      .populate({
        path: "owner",
        select: "_id notifEvent",
      })
      .populate("category");
    const registerDb = await EventParticipants.findOne({
      user: user.id,
      eventId: event_id,
    });
    const evLink = `alleven://eventDetail/${event_id}`;

    const dataNotif = {
      status: 2,
      date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
      user: eventDb.owner._id.toString(),
      type: "impression",
      message: `Пользователь ${user.name} поделился впечатлением о событии ${eventDb.name}.`,
      event: event_id,
      link: evLink,
    };
    const nt = new Notification(dataNotif);
    await nt.save();
    if (eventDb.owner.notifEvent) {
      notifEvent.emit(
        "send",
        eventDb.owner._id.toString(),
        JSON.stringify({
          type: "impression",
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          message: `Пользователь ${user.name} поделился впечатлением о событии ${eventDb.name}.`,
          categoryIcon: eventDb.category.avatar, //sarqel
          link: evLink,
        })
      );
    }

    return res
      .status(200)
      .send({ updated: result.bool, success: true, data: result.result });
  };

  myParticipant = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      let resArray = [];
      const resDb = await EventParticipants.find({
        user: user.id,
      })
        .populate({
          path: "eventId",
          populate: [{ path: "images" }],
        })
        .exec();
      for (let i = 0; i < resDb.length; i++) {
        resArray.push(resDb[i].eventId);
      }
      function separateUpcomingAndPassed(events) {
        const upcoming = [];
        const passed = [];

        events.forEach((event) => {
          const dateNow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");

          if (event.started_time > dateNow) {
            upcoming.push(event);
          } else {
            passed.push(event);
          }
        });

        return { upcoming, passed };
      }

      const upcomPass = separateUpcomingAndPassed(resArray);

      function calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371;

        const latRad1 = (lat1 * Math.PI) / 180;
        const lonRad1 = (lon1 * Math.PI) / 180;
        const latRad2 = (lat2 * Math.PI) / 180;
        const lonRad2 = (lon2 * Math.PI) / 180;

        const dLat = latRad2 - latRad1;
        const dLon = lonRad2 - lonRad1;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latRad1) *
            Math.cos(latRad2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance;
      }

      const myLatitude = 55.7558;
      const myLongitude = 37.6176;

      upcomPass.upcoming.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.latitude,
          meeting.longitude
        );
      });
      upcomPass.passed.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.latitude,
          meeting.longitude
        );
      });
      upcomPass.upcoming.sort((a, b) => a.kilometr - b.kilometr);
      upcomPass.passed.sort((a, b) => a.kilometr - b.kilometr);
      const data = {};
      data.upcoming = upcomPass.upcoming;
      data.passed = upcomPass.passed;

      return res.status(200).send({ message: "success", data });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal server error" });
    }
  };

  myEvents = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(" ")[1];

        const userToken = jwt.decode(token);
        const user = userToken.id;
        const resDb = await Event.find({ owner: user, status: { $ne: 2 } })
          .populate({ path: "owner", select: "-password" })
          .populate({
            path: "participants",
            populate: { path: "user", select: "name surname avatar" },
          })
          .populate("likes")
          .populate("images")
          .populate("participantsSpot")
          .populate("views")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "user", select: "name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "user", select: "name surname avatar" },
              {
                path: "answer",
                populate: { path: "user", select: "name surname avatar" },
              },
            ],
          })
          .exec();

        let pastLikes;
        let pastComment;
        let view;
        let favorites;
        let pastParticipants;
        let countAll = 0;
        for (let i = 0; i < resDb.length; i++) {
          pastLikes = resDb[i].likes.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          pastComment = resDb[i].comments.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          view = resDb[i].views.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          favorites = resDb[i].favorites.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          pastParticipants = resDb[i].participants.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          let count =
            pastLikes.length +
            pastComment.length +
            view.length +
            pastParticipants.length +
            favorites.length;
          countAll = countAll + count;
          if (favorites.length) {
            resDb[i].changes.favorites = true;
          }
          if (pastLikes.length) {
            resDb[i].changes.like = true;
          }
          if (pastComment.length) {
            resDb[i].changes.comment = true;
          }
          if (pastParticipants.length) {
            resDb[i].changes.participant = true;
          }
          if (view.length) {
            resDb[i].changes.view = true;
          }
          if (count) {
            resDb[i].changes.count = count;
          }
          await resDb[i].save();
        }

        function separateUpcomingAndPassed(events) {
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            const dateNow = moment
              .tz(process.env.TZ)
              .format("YYYY-MM-DD HH:mm");

            if (event.started_time > dateNow) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }

        const separatedEvents = separateUpcomingAndPassed(resDb);
        if (separatedEvents.passed.length > 0) {
          for (let i = 0; i < separatedEvents.passed.length; i++) {
            await Event.findByIdAndUpdate(separatedEvents.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        const filter = separatedEvents.passed.filter(
          (event) => event.status === 1
        );

        const dateChange = await Event.find({ owner: user });

        for (let x = 0; x < dateChange.length; x++) {
          dateChange[x].changes.comment = false;
          dateChange[x].changes.like = false;
          dateChange[x].changes.participant = false;
          dateChange[x].changes.view = false;
          dateChange[x].changes.favorites = false;
          dateChange[x].changes.count = 0;
          dateChange[x].changedStatusDate = moment.tz(process.env.TZ).format();
          await dateChange[x].save();
        }

        separatedEvents.upcoming.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.status(200).send({
          message: "success",
          upcoming: separatedEvents.upcoming,
          passed: filter,
          count: countAll,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  };

  index = async (req, res) => {
    let userRole = "USER";
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);

    if (user.id) {
      userRole = await this.UserService.getRoleByuser(user.id);
    }

    const params = {};
    const { category, situation, dateFrom, dateTo } = req.query;

    if (dateFrom) {
      let date = new Date(dateFrom);
      if (dateTo) {
        date = new Date(dateTo);
      }
      let date_to = date.setHours(date.getHours() + 23);
      date_to = date.setMinutes(date.getMinutes() + 59);
      date_to = date.setSeconds(date.getSeconds() + 59);
      date_to = date.setMilliseconds(date.getMilliseconds() + 999);
      params.started_time = {
        $gte: new Date(dateFrom).toISOString(),
        $lte: new Date(date_to).toISOString(),
      };
    }
    if (category) {
      params.category = category.split(",");
    }
    if (situation) {
      params.situation = situation;
    }
    if (userRole == "USER") {
      params.owner = user.id;
    } else {
      params.status = 1;
    }

    const events = await this.EventService.get(params);

    events.map((i) => {
      if (!isNaN(+i.status)) {
        delete Object.assign(i, { eventStatus: +i.status })["status"];
      }
    });

    return res.json({ status: "success", data: events });
  };

  single = async (req, res) => {
    const id = req.params.id;
    const event = await Event.findById(id).populate("ratings");
    function calculateAverageRating(ratings) {
      if (ratings.length === 0) return 0;

      const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

      const average = total / ratings.length;

      return Math.round(average * 10) / 10;
    }
    const averageRating = calculateAverageRating(event.ratings);
    const eventUpdate = await Event.findOneAndUpdate(
      { _id: id },
      {
        $set: { ratingCalculated: averageRating }, 
      },
      { new: true } 
    )
      .populate({ path: "owner", select: "name surname avatar phone_number" })
      .populate({
        path: "participants",
        populate: {
          path: "user",
          select: "name surname avatar phone_number",
        },
      })
      .populate("likes")
      .populate("images")
      .populate("participantsSpot")
      .populate("views")
      .populate("favorites")
      .populate({
        path: "ratings",
        populate: { path: "user", select: "name surname avatar" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "user", select: "name surname avatar" },
          {
            path: "answer", 
            populate: { path: "user", select: "name surname avatar" }, 
          },
        ],
      })
      .exec();

    return res.status(200).send({
      status: "success",
      data: eventUpdate,
    });
  };

  store = async (req, res) => {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];

    const user = jwt.decode(token);
    let event = await this.EventService.store(req, user.id);

    notifEvent.emit(
      "send",
      "ADMIN",
      JSON.stringify({
        type: "Новая события",
        message: event.name,
        data: event,
      })
    );
    const userDb = await User.findById(user.id);

    const dat = event.started_time + ":00";

    const eventTime = moment.tz(dat, process.env.TZ);

    const notificationTime = eventTime.clone().subtract(1, "hour");


    const currentTime = moment.tz(process.env.TZ).format();

    async function sendMessage(idMeet) {
      const eventDb = await Event.findById(idMeet)
        .populate({
          path: "participants",
          populate: { path: "owner", select: "_id fcm_token notifEvent" },
        })
        .populate("participantSpot")
        .populate("category")
        .exec();

      if (eventDb.participants.length) {
        for (let i = 0; i < eventDb.participants.length; i++) {
          const element = eventDb.participants[i].user;
          if (element.fcm_token[0]) {
            const evLink = `alleven://eventDetail/${eventDb._id}`;
            const dataNotif = {
              status: 2,
              date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
              user: d.owner.toString(),
              type: "participation",
              message: `Ваше событие ${d.name} находится на модерации`,
              categoryIcon: eventDb.category.avatar,
              event: eventDb._id,
              link: evLink,
            };
            const nt = new Notification(dataNotif);
            await nt.save();
            console.log(
              `Событие ${eventDb.purpose} начнется через час. Не пропустите.`
            );
            const date_time = moment.tz(process.env.TZ).format();
            if (userDb.notifEvent) {
              notifEvent.emit(
                "send",
                element._id,
                JSON.stringify({
                  type: "participation",
                  date_time,
                  message: `Событие ${eventDb.purpose} начнется через час. Не пропустите.`,
                  categoryIcon: eventDb.category.avatar, 
                  link: evLink,
                })
              );
            }
          }
        }
      }
    }

    schedule.scheduleJob(notificationTime.toDate(), () => {
      sendMessage(event._id.toString());
    });
    async function sendEventMessage(idMeetSpot) {
      const eventDb = await Event.findById(idMeetSpot)
        .populate({
          path: "participantsSpot",
          populate: { path: "owner", select: "_id fcm_token notifEvent" },
        })
        .populate("category")
        .exec();
      if (eventDb) {
        if (eventDb.notifEvent && eventDb.participantsSpot.length) {
          for (let i = 0; i < eventDb.participantsSpot.length; i++) {
            const element = eventDb.participantsSpot[i].user;
            if (element.fcm_token[0]) {
              const evLink = `alleven://eventDetail/${eventDb._id}`;
              const dataNotif = {
                status: 2,
                date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
                user: eventDb.owner._id.toString(),
                type: "participationSpot",
                message: `Ваше событие ${eventDb.name} находится на модерации`,
                categoryIcon: eventDb.category.avatar,
                event: eventDb._id,
                link: evLink,
              };
              const nt = new Notification(dataNotif);
              await nt.save();
              console.log(`Событие ${eventDb.purpose} началось.`);
              const date_time = moment
                .tz(process.env.TZ)
                .format("YYYY-MM-DD HH:mm");

              notifEvent.emit(
                "send",
                element._id,
                JSON.stringify({
                  type: "participationSpot",
                  date_time,
                  message: `Событие ${eventDb.purpose} началось.`,
                  categoryIcon: eventDb.category.avatar, 
                  link: evLink,
                })
              );
            }
          }
        }
      }
    }
    schedule.scheduleJob(eventTime.toDate(), () => {
      sendEventMessage(event._id.toString());
    });

    return res.json({ status: "success", data: event });
  };

  edit = async (req, res) => {
    const event_id = req.params.id;
    const datas = req.body;
    datas.status = "0";
    const updated = await this.EventService.update(event_id, datas);
    let message = "Successfully updated";
    if (updated) {
      res.status(200);
    } else {
      res.status(400);
      message = "No such event exists";
    }

    return res.json({ message });
  };

  userImpressions = async (req, res) => {
    const { user_id, event_id } = req.query;
    let impressions = await this.ImpressionService.getByUserEvent({
      user_id,
      event_id,
    });
    return res.json({ status: "success", data: impressions });
  };

  nearEvent = async (req, res) => {
    const id = req.params.id;
    const authHeader = req.headers.authorization;
    let data;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const resDb = await Event.findById(id).populate("ratings");
      const ifView = await EventView.findOne({ user: user.id, eventId: id });

      function calculateAverageRating(ratings) {
        if (ratings.length === 0) return 0;

        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

        const average = total / ratings.length;

        return Math.round(average * 10) / 10;
      }

      const averageRating = calculateAverageRating(resDb.ratings);

      if (!ifView) {
        const view = new EventView({
          user: user.id,
          eventId: id,
          date: moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        });
        await view.save();
        data = await Event.findByIdAndUpdate(
          { _id: id },
          {
            $push: { view: view._id }, 
            $set: { ratingCalculated: averageRating }, 
          },
          { new: true }
        )
          .populate({ path: "owner", select: "-password" })
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate({
            path: "participantsSpot",
            populate: { path: "user", select: "name surname avatar" },
          })
          .populate({
            path: "impression_images", 
            populate: { path: "user", select: "name surname avatar" },
          })
          .populate("views")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "user", select: "_id name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "user", select: "_id name surname avatar" }, 
              {
                path: "answer", 
                populate: { path: "user", select: "name surname avatar" }, 
              },
            ],
          })
          .exec();
        for (let i = 0; i < data.comments.length; i++) {
          for (let z = 0; z < data.comments[i].answer.length; z++) {
            const findLike = await EventCommentAnswerLike.findOne({
              user: user.id,
              answerId: data.comments[i].answer[z]._id,
            });
            if (findLike) {
              data.comments[i].answer[z].isLike = true;
            }
          }
          const findCommentLike = await EventCommentLikes.findOne({
            user: user.id,
            commentId: data.comments[i]._id,
          });
          if (findCommentLike) {
            data.comments[i].isLike = true;
          }
        }
        const isRating = await EventRating.findOne({
          user: user.id,
          event: id,
        });
        data.isRating = isRating ? true : false;
        const isLike = await EventLike.findOne({
          user: user.id,
          eventId: id,
        });
        data.isLike = isLike ? true : false;
        const isFavorite = await EventFavorites.findOne({
          user: user.id,
          eventId: id,
        });
        data.isFavorite = isFavorite ? true : false;
        const isJoin = await EventParticipants.findOne({
          user: user.id,
          eventId: id,
        });
        const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
        const eventTime = new Date(data.started_time);
        const dateNow = new Date(timeMoscow);

        const timeDifference = eventTime - dateNow;

        const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

        if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
          data.hour = true;
        }
        if (isJoin) {
          data.joinStatus = 2;

        }

        const isSpot = await EventParticipantsSpot.findOne({
          user: user.id,
          eventId: id,
        });
        if (isSpot) {
          data.joinStatus = 3;
        }
        res.status(200).send({ message: "success", data });
      } else {
        data = await Event.findByIdAndUpdate(
          { _id: id },
          {
            $set: { ratingCalculated: averageRating }, 
          },
          { new: true }
        )
          .populate({ path: "owner", select: "-password" })
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate({
            path: "impression_images",
            populate: { path: "user", select: "name surname avatar" },
          })
          .populate("participantsSpot")
          .populate("views")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "user", select: "_id name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "user", select: "_id name surname avatar" }, 
              {
                path: "answer", 
                populate: { path: "user", select: "name surname avatar" }, 
              },
            ],
          })
          .exec();
        const isRating = await EventRating.findOne({
          user: user.id,
          event: id,
        });
        data.isRating = isRating ? true : false;
        const isLike = await EventLike.findOne({
          user: user.id,
          eventId: id,
        });
        data.isLike = isLike ? true : false;
        const isFavorite = await EventFavorites.findOne({
          user: user.id,
          eventId: id,
        });
        data.isFavorite = isFavorite ? true : false;
        const isJoin = await EventParticipants.findOne({
          user: user.id,
          eventId: id,
        });
        const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");

        const eventTime = new Date(data.started_time);
        const dateNow = new Date(timeMoscow);

        const timeDifference = eventTime - dateNow;

        const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

        if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
          data.hour = true;
        }
     
        if (isJoin) {
          data.joinStatus = 2;
        }

        const isSpot = await EventParticipantsSpot.findOne({
          user: user.id,
          eventId: id,
        });
        if (isSpot) {
          data.joinStatus = 3;
        }
        for (let i = 0; i < data.comments.length; i++) {
          for (let z = 0; z < data.comments[i].answer.length; z++) {
            const findLike = await EventCommentAnswerLike.findOne({
              user: user.id,
              answerId: data.comments[i].answer[z]._id,
            });
            if (findLike) {
              data.comments[i].answer[z].isLike = true;
            }
          }
          const findCommentLike = await EventCommentLikes.findOne({
            user: user.id,
            commentId: data.comments[i]._id,
          });
          if (findCommentLike) {
            data.comments[i].isLike = true;
          }
        }
        res.status(200).send({ message: "success", data });
      }
    } else {
      const resDb = await Event.findById(id).populate("ratings").exec();
      function calculateAverageRating(ratings) {
        if (ratings.length === 0) return 0;

        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

        const average = total / ratings.length;

        return Math.round(average * 10) / 10;
      }

      const averageRating = calculateAverageRating(resDb.ratings);

      data = await Event.findByIdAndUpdate(
        { _id: id },
        {
          $set: { ratingCalculated: averageRating }, 
        },
        { new: true }
      )
        .populate({ path: "owner", select: "-password" })
        .populate("participants")
        .populate("likes")
        .populate("images")
        .populate("participantsSpot")
        .populate("views")
        .populate("favorites")
        .populate({
          path: "ratings",
          populate: { path: "user", select: "_id name surname avatar" },
        })
        .populate({
          path: "comments",
          populate: [
            { path: "user", select: "_id name surname avatar" }, 
            {
              path: "answer", 
              populate: { path: "user", select: "name surname avatar" }, 
            },
          ],
        })
        .exec();
      const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
      const eventTime = new Date(data.started_time);
      const dateNow = new Date(timeMoscow);

      const timeDifference = eventTime - dateNow;

      const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

      if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
        data.hour = true;
      }
      //  else if (differenceInMinutes <= 0) {
      //   hour=false
      //   console.log("The start time has already passed.");
      // } else {
      //   hour=false
      //   console.log("The start time is more than an hour away.");
      // }
      // for (let i = 0; i < data.comments.length; i++) {
      //   for (let z = 0; z < data.comments[i].answer.length; z++) {
      //     const findLike = await EventCommentAnswerLike.findOne({
      //       user: user.id,
      //       answerId: data.comments[i].answer[z]._id,
      //     });
      //     if (findLike) {
      //       data.comments[i].answer[z].isLike = true;
      //     }
      //   }
      //   const findCommentLike = await EventCommentLikes.findOne({
      //     user: user.id,
      //     commentId: data.comments[i]._id,
      //   });
      //   if (findCommentLike) {
      //     data.comments[i].isLike = true;
      //   }
      // }
      res.status(200).send({ message: "success", data });
    }

  };

  eventImpressions = async (req, res) => {
    try {
      const { event_id } = req.query;
      let events = [];
      if (req.user.role_name === "USER") {
        events = await this.EventService.findVisitorImpressions(req.user.id);
      } else {
        events = await this.EventService.findOwnerImpressions(req.user.id);
      }

      for (const event of events) {
        if (!isNaN(+event.status)) {
          event._doc.eventStatus = +event.status;
          delete event._doc.status;
        }
      }
      return res.json({ status: "success", data: events });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  };

  allEvent = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader !== "null") {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const result = await Event.find({
          owner: { $ne: user.id },
          status: 1,
        }).populate({ path: "category", select: "avatar name map_avatar" });
        function separateUpcomingAndPassed(events) {
          const now = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            if (event.started_time > now) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }
        const separatedEvents = separateUpcomingAndPassed(result);
        if (separatedEvents.passed.length > 0) {
          for (let i = 0; i < separatedEvents.passed.length; i++) {
            await Event.findByIdAndUpdate(separatedEvents.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const earthRadius = 6371; // Radius of the Earth in kilometers

          const latRad1 = (lat1 * Math.PI) / 180;
          const lonRad1 = (lon1 * Math.PI) / 180;
          const latRad2 = (lat2 * Math.PI) / 180;
          const lonRad2 = (lon2 * Math.PI) / 180;

          const dLat = latRad2 - latRad1;
          const dLon = lonRad2 - lonRad1;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latRad1) *
              Math.cos(latRad2) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;

          return distance; 
        }

        const myLatitude = 55.7558;
        const myLongitude = 37.6176;
        result.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });

        result.sort((a, b) => a.kilometr - b.kilometr);
        return res.status(200).send(result);
      } else {
        const result = await Event.find({ status: { $eq: 1 } }).populate({
          path: "category",
          select: "avatar name map_avatar",
        });
        function separateUpcomingAndPassed(events) {
          const now = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            if (event.started_time > now) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }
        const separatedEvents = separateUpcomingAndPassed(result);
        if (separatedEvents.passed.length > 0) {
          for (let i = 0; i < separatedEvents.passed.length; i++) {
            await Event.findByIdAndUpdate(separatedEvents.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const earthRadius = 6371; // Radius of the Earth in kilometers

          const latRad1 = (lat1 * Math.PI) / 180;
          const lonRad1 = (lon1 * Math.PI) / 180;
          const latRad2 = (lat2 * Math.PI) / 180;
          const lonRad2 = (lon2 * Math.PI) / 180;

          const dLat = latRad2 - latRad1;
          const dLon = lonRad2 - lonRad1;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latRad1) *
              Math.cos(latRad2) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;

          return distance; 
        }

        const myLatitude = 55.7558;
        const myLongitude = 37.6176;
        result.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });

        result.sort((a, b) => a.kilometr - b.kilometr);
        return res.status(200).send(result);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  };
  allFilter = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      let dbObj = [];
      let resultObj = {};
      let categoryArray = [];
      let eventsArray = [];

      const resultCategory = await EventCategory.find();
      if (authHeader) {

        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);

        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].avatar;
          obj.description = resultCategory[i].description;
          obj.id = resultCategory[i]._id;
          const resultEvent = await Event.find({
            category: resultCategory[i]._id,
            owner: { $ne: user.id },
          });
          obj.events = resultEvent;
          dbObj.push(obj);
        }

        const sortArray = dbObj.sort(
          (a, b) => b.events.length - a.events.length
        );

        for (let z = 0; z < sortArray.length; z++) {
          for (let r = 0; r < sortArray[z].events.length; r++) {
            eventsArray.push(sortArray[z].events[r]);
          }
        }
        resultObj.events = eventsArray;
        for (let x = sortArray.length - 1; x >= 0; x--) {
          let objNew = {};
          objNew.category_name = sortArray[x].category;
          objNew.id = sortArray[x].id;
          objNew.avatar = sortArray[x].avatar;
          objNew.description = sortArray[x].description;
          categoryArray.unshift(objNew);
        }
        resultObj.category = categoryArray;
        return res.status(200).send(resultObj);

      } else {
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].avatar;
          obj.description = resultCategory[i].description;
          obj.id = resultCategory[i]._id;
          const resultEvent = await Event.find({
            category: resultCategory[i]._id,
          });
          obj.events = resultEvent;
          dbObj.push(obj);
        }

        const sortArray = dbObj.sort(
          (a, b) => b.events.length - a.events.length
        );

        for (let z = 0; z < sortArray.length; z++) {
          for (let r = 0; r < sortArray[z].events.length; r++) {
            eventsArray.push(sortArray[z].events[r]);
          }
        }

        resultObj.events = eventsArray;
        for (let x = sortArray.length - 1; x >= 0; x--) {
          let objNew = {};
          objNew.category_name = sortArray[x].category;
          objNew.id = sortArray[x].id;
          objNew.avatar = sortArray[x].avatar;
          objNew.description = sortArray[x].description;
          categoryArray.unshift(objNew);
        }
        resultObj.category = categoryArray;

        return res.status(200).send(resultObj);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  };
  radius = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { longitude, latitude } = req.body;

      function calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371; // Radius of the Earth in kilometers

        const latRad1 = (lat1 * Math.PI) / 180;
        const lonRad1 = (lon1 * Math.PI) / 180;
        const latRad2 = (lat2 * Math.PI) / 180;
        const lonRad2 = (lon2 * Math.PI) / 180;

        const dLat = latRad2 - latRad1;
        const dLon = lonRad2 - lonRad1;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latRad1) *
            Math.cos(latRad2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance; 
      }

      const myLatitude = latitude;
      const myLongitude = longitude;

      if (!authHeader) {
        const pointsOfInterest = await Event.find();

        pointsOfInterest.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });
        pointsOfInterest.sort((a, b) => a.kilometr - b.kilometr);

        res.send(pointsOfInterest);
      } else {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const pointsOfInterest = await Event.find({ owner: { $ne: user.id } });

        pointsOfInterest.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });

        pointsOfInterest.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send(pointsOfInterest);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "An error occurred" });
    }
  };

  socket = async (req, res) => {
    const db = await Event.findById("6748282c568a9e88c540b206");
    notifEvent.emit(
      "send",
      db.owner.toString(),
      JSON.stringify({ type: "Новая события", message: "event", data: db })
    );

    return res.status(200).send("result");
  };

  opportunity = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // if (authHeader&&authHeader!=="null") {
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const userDb = await User.findById(user.id);

      if (userDb.eventNotif) {
        userDb.eventNotif = false;
        await userDb.save();
      } else {
        userDb.eventNotif = true;
        await userDb.save();
      }

      return res.status(200).send({ message: "success" });
      // } else {
      //   return res.status(401).send("Unauthorized");
      // }
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  };

  upcoming = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { longitude, latitude } = req.body;
      if (authHeader && authHeader !== "null") {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const events = await Event.find({
          owner: { $ne: user.id },
          status: 1,
        })
          .populate({ path: "category", select: "avatar name map_avatar" })
          .populate({ path: "images", select: "name" });
        function separateUpcomingAndPassed(events) {
          const now = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            // const eventDate = new Date(event.started_time);
            if (event.started_time > now) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }

        const result = separateUpcomingAndPassed(events);
        if (result.passed.length > 0) {
          for (let i = 0; i < result.passed.length; i++) {
            await Event.findByIdAndUpdate(result.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        for (let z = 0; z < result.upcoming.length; z++) {
          const participant = await EventParticipants.findOne({
            eventId: result.upcoming[z]._id,
            user: user.id,
          });
          const participantSpot = await EventParticipantsSpot.findOne({
            eventId: result.upcoming[z]._id,
            user: user.id,
          });
          if (participant) {
            result.upcoming[z].joinStatus = 2;
            if (participantSpot) {
              result.upcoming[z].spotStatus = 3;
            }
          }
        }
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const earthRadius = 6371; // Radius of the Earth in kilometers

          // Convert latitude and longitude from degrees to radians
          const latRad1 = (lat1 * Math.PI) / 180;
          const lonRad1 = (lon1 * Math.PI) / 180;
          const latRad2 = (lat2 * Math.PI) / 180;
          const lonRad2 = (lon2 * Math.PI) / 180;

          // Haversine formula
          const dLat = latRad2 - latRad1;
          const dLon = lonRad2 - lonRad1;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latRad1) *
              Math.cos(latRad2) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;

          return distance; // Distance in kilometers
        }
        const myLatitude = 55.7558;
        const myLongitude = 37.6176;
        result.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });

        result.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        // passed.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({
          message: "success",
          data: result.upcoming,
          // passed: result.passed,
        });
      } else {
        const events = await Event.find({ status: 1 })
          .populate({ path: "category", select: "avatar name map_avatar" })
          .populate({ path: "images", select: "name" });

        function separateUpcomingAndPassed(events) {
          const now = new Date();
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            const eventDate = new Date(event.started_time);
            if (eventDate > now) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }

        const result = separateUpcomingAndPassed(events);
        if (result.passed.length > 0) {
          for (let i = 0; i < result.passed.length; i++) {
            await Event.findByIdAndUpdate(result.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const earthRadius = 6371; // Radius of the Earth in kilometers

          // Convert latitude and longitude from degrees to radians
          const latRad1 = (lat1 * Math.PI) / 180;
          const lonRad1 = (lon1 * Math.PI) / 180;
          const latRad2 = (lat2 * Math.PI) / 180;
          const lonRad2 = (lon2 * Math.PI) / 180;

          // Haversine formula
          const dLat = latRad2 - latRad1;
          const dLon = lonRad2 - lonRad1;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latRad1) *
              Math.cos(latRad2) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;

          return distance; // Distance in kilometers
        }
        const myLatitude = 55.7558;
        const myLongitude = 37.6176;
        result.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });
        result.passed.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.latitude,
            meeting.longitude
          );
        });

        result.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        result.passed.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({
          message: "success",
          data: result.upcoming,
        });
      }
    } catch (error) {
      console.error(error);

      return res.status(500).send("Internal Server Error");
    }
  };

  addParticipant = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // if (authHeader&&authHeader!=="null") {
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      // const user = { id: "656ecb2e923c5a66768f4cd3" };
      const { id } = req.body;
      if (id) {
        const participant = new EventParticipants({
          user: user.id,
          eventId: id,
          date: moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        });
        await participant.save();
        const result = await Event.findByIdAndUpdate(id, {
          $push: { participants: participant._id },
        })
          .populate("owner")
          .populate("category");
        const evLink = `alleven://eventDetail/${id}`;
        const userDb = await User.findById(user.id);
        const dataNotif = {
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          user: result.owner._id.toString(),
          type: "participation",
          message: `Пользователь ${userDb.name} присоединился к событию ${result.name}.`,
          event: result._id,
          link: evLink,
        };
        const nt = new Notification(dataNotif);
        await nt.save();
        if (result.owner.notifEvent) {
          const UserDb = await User.findById(user.id);

          notifEvent.emit(
            "send",
            result.owner._id.toString(),
            JSON.stringify({
              type: "participation",
              date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
              message: `Пользователь ${userDb.name} присоединился к событию ${result.name}.`,
              categoryIcon: result.category.avatar, //sarqel
              link: evLink,
            })
          );
        }
        return res.status(200).send({ message: "success" });
      } else {
        return res.status(401).send({ message: "Event not found" });
      }
      // } else {
      //   return res.status(401).send({ message: "Unauthorized" });
      // }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal Server Error" });
    }
  };
  addParticipantSpot = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // if (authHeader&&authHeader!=="null") {
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      // const user = { id: "656ecb2e923c5a66768f4cd3" };
      const { id } = req.body;
      if (id) {
        const participantSpot = new EventParticipantsSpot({
          user: user.id,
          eventId: id,
        });
        await participantSpot.save();
        const result = await Event.findByIdAndUpdate(id, {
          $push: { participantsSpot: participantSpot._id },
        })
          .populate({ path: "owner", select: "_id notifEvent" })
          .populate("category");
        const evLink = `alleven://eventDetail/${id}`;
        const dataNotif = {
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          user: result.owner._id.toString(),
          type: "participationSpot",
          message: `Пользователь ${user.name} пришел на ваше событие ${result.name}. `,
          categoryIcon: result.category.avatar,
          event: result.category.avatar,
          link: evLink,
        };
        const nt = new Notification(dataNotif);
        await nt.save();
        if (result.owner.notifEvent) {
          notifEvent.emit(
            "send",
            result.owner._id.toString(),
            JSON.stringify({
              type: "participationSpot",
              date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
              message: `Пользователь ${user.name} пришел на ваше событие ${result.name}. `,
              categoryIcon: result.category.avatar, //sarqel
              link: evLink,
            })
          );
        }

        return res.status(200).send({ message: "success" });
      } else {
        return res.status(401).send({ message: "id not found" });
      }
      // } else {
      //   return res.status(401).send("Unauthorized");
      // }
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  };
  // testUpcoming = async (req, res) => {
  //   // const authHeader = req.headers.authorization;
  //   // if (authHeader) {
  //   //   const token = authHeader.split(" ")[1];
  //   //   const user = jwt.decode(token);
  //   const user = { id: "656ecb2e923c5a66768f4cd3" };
  //     const events = await Event.find({
  //       owner: { $ne: user.id },
  //       status: 1,
  //     })
  //       .populate({ path: "category", select: "avatar name map_avatar" })
  //       .populate({ path: "images", select: "name" });
  //     function separateUpcomingAndPassed(events) {
  //       const now = new Date();
  //       const upcoming = [];
  //       const passed = [];

  //       events.forEach((event) => {
  //         const eventDate = new Date(event.started_time);
  //         if (eventDate > now) {
  //           upcoming.push(event);
  //         } else {
  //           passed.push(event);
  //         }
  //       });

  //       return { upcoming, passed };
  //     }

  //     const result = separateUpcomingAndPassed(events);
  //     if (result.passed.length > 0) {
  //       for (let i = 0; i < result.passed.length; i++) {
  //         await Event.findByIdAndUpdate(result.passed[i]._id, { situation: "passed"} );
  //       }
  //     }
  //     res.status(200).send({
  //       message: "success",
  //       upcoming: result.upcoming,
  //       passed: result.passed,
  //     });
  //   // }
  // }
}

export default new EventController();
