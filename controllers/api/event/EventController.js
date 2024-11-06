import expressWs from "express-ws";
import EventService from "../../../services/EventService.js";
import ImpressionService from "../../../services/ImpressionService.js";
import notifEvent from "../../../events/NotificationEvent.js";
import EventRatingService from "../../../services/EventRatingService.js";
import CalculateTheDistance from "../../../services/CalculateTheDistance.js";
import UserService from "../../../services/UserService.js";
import Event from "../../../models/event/Event.js";
import EventCategory from "../../../models/event/EventCategory.js";
import EventImage from "../../../models/event/EventImage.js";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
import EventParticipants from "../../../models/event/EventParticipants.js";
import e from "express";
import EventView from "../../../models/event/EventView.js";
import EventParticipantsSpot from "../../../models/event/EventParticipantsSpot.js";
import EventLike from "../../../models/event/EventLike.js";
import EventFavorites from "../../../models/event/EventFavorites.js";
import moment from "moment";
import EventRating from "../../../models/event/EventRating.js";

class EventController {
  constructor() {
    this.EventService = new EventService();
    this.ImpressionService = new ImpressionService();
    this.EventRatingService = new EventRatingService();
    this.CalculateTheDistance = new CalculateTheDistance();
    this.UserService = new UserService();
  }

  myParticipant = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // if (authHeader&&authHeader!=="null") {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        // const userId = user.id;
        let resArray = [];
        // const userId = "656ecb2e923c5a66768f4cd5";
        const resDb = await EventParticipants.find({
          userId: user.id,
        })
          .populate({
            path: "eventId", // Populates eventId
            populate: [
              { path: "images" }, // Populates images inside eventId    // Populates likes inside eventId
            ],
          })
          .exec();
        for (let i = 0; i < resDb.length; i++) {
          resArray.push(resDb[i].eventId);
        }
        function separateUpcomingAndPassed(events) {
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            // console.log("event.startTime", event.started_time);
            // const startTime = new Date(event.started_time);
            // console.log("startTime", startTime);
            const dateNow = moment
              .tz(process.env.TZ)
              .format("YYYY-MM-DD HH:mm");
            // const dateNow = new Date(formattedDateNow);
            // console.log("dateNow", dateNow);

            if (event.started_time > dateNow) {
              upcoming.push(event);
            } else {
              console.log("passed");

              passed.push(event);
              // console.log("passed", passed);
            }
          });
          // console.log("upcoming", upcoming);
          // console.log("passed", passed);

          return { upcoming, passed };
        }

        const upcomPass = separateUpcomingAndPassed(resArray);

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

        upcomPass.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });
        upcomPass.passed.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });


        upcomPass.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        upcomPass.passed.sort((a, b) => a.kilometr - b.kilometr);




        const data = {};
        data.upcoming = upcomPass.upcoming;
        data.passed = upcomPass.passed;

        return res.status(200).send({ message: "success", data });
      // } else {
      //   return res.status(401).send({ message: "Unauthorized" });
      // }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal server error" });
    }
  };

  myEvents = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader&&authHeader!=="null") {
        const token = authHeader.split(" ")[1];
        console.log(authHeader, "authHeader");
        
        const user = jwt.decode(token);
        // const user = { id: "656ecb2e923c5a66768f4cd3" };
        const userId = user.id;
        const resDb = await Event.find({ owner: userId, status: { $ne: 2 } })
          .populate("owner")
          .populate({
            path: "participants",
            populate: { path: "userId", select: "name surname avatar" },
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
              { path: "user", select: "name surname avatar" }, // Populate userId in comments
              {
                path: "answer", 
                populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
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
              console.log("passed");

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
        let passed = [];
        console.log("filter", filter);



        const dateChange = await Event.find({ owner: userId });
       

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
        
        separatedEvents.upcoming.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
       
        res.status(200).send({
          message: "success",
          upcoming: separatedEvents.upcoming,
          passed:filter,
          count: countAll,
        });
      } else {
        console.log("login chexac");
        
        const resDb = await meetingModel
          .find({ status: { $ne: 2 } })
          .populate("userId")
          .populate("participants")
          .populate("comments")
          .populate("likes")
          .populate("images")
          .populate("participantSpot");
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
        const separatedEvents = separateUpcomingAndPassed(resDb);
        if (separatedEvents.passed.length > 0) {
          for (let i = 0; i < separatedEvents.passed.length; i++) {
            await Event.findByIdAndUpdate(separatedEvents.passed[i]._id, {
              situation: "passed",
            });
          }
        }
        console.log(separatedEvents.passed, "separatedEvents.passed");
        separatedEvents.upcoming.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return {
          message: "success",
          upcoming: separatedEvents.upcoming,
          passed: separatedEvents.passed,
          // count: countAll,
        };
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
    // if (authHeader) {

      if (user.id) {
        userRole = await this.UserService.getRoleByUserId(user.id);
      }
    // }
    // if (req.user) {
    //   userRole = await this.UserService.getRoleByUserId(req.user.id);
    // }

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
        $set: { ratingCalculated: averageRating }, // Set new rating
      },
      { new: true } // Return the updated document
    )
      .populate({ path: "owner", select: "name surname avatar" })
      .populate({path:"participants",populate:{path:"userId",select:"name surname avatar phone_number"}})
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
          { path: "user", select: "name surname avatar" }, // Populate userId in comments
          {
            path: "answer", // Populate the answer array
            populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
          },
        ],
      })
      .exec();
    // const events = await this.EventService.findAndLean(req.params.id);

    // if (!isNaN(+events.status)) {
    //   delete Object.assign(events, { eventStatus: +events.status })["status"];
    // }
    // const eventCommentArithMean =
    //   await this.EventRatingService.arithmeticalMean(req.params.id);
    return res.status(200).send({
      status: "success",
      data: eventUpdate,
    });
  };

  store = async (req, res) => {
    const authHeader = req.headers.authorization;

    // if (authHeader&&authHeader!=="null") {
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
      return res.json({ status: "success", data: event });
    // } else {
    //   return res.json({ status: "success", data: "Unauthorized" });
    // }
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
    // let hour = false;
    if (authHeader&&authHeader!=="null") {
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      // const user = { id: "656ecb2e923c5a66768f4cd3" };
      const resDb = await Event.findById(id)
        .populate("ratings")
        .populate("comments");
      const ifView = await EventView.findOne({ userId: user.id, eventId: id });

      function calculateAverageRating(ratings) {
        if (ratings.length === 0) return 0;

        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

        const average = total / ratings.length;

        return Math.round(average * 10) / 10;
      }

      const averageRating = calculateAverageRating(resDb.ratings);

      if (!ifView) {
        const view = new EventView({
          userId: user.id,
          eventId: id,
          date: moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        });
        await view.save();
        data = await Event.findByIdAndUpdate(
          { _id: id },
          {
            $push: { view: view._id }, // Increment view count
            $set: { ratingCalculated: averageRating }, // Set new rating
          },
          { new: true }
        )
          .populate("owner")
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate({
            path: "participantsSpot",
            populate: { path: "userId", select: "name surname avatar" },
          })
          .populate({
            path: "impression_images", //impression_images
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
              { path: "user", select: "_id name surname avatar" }, // Populate userId in comments
              {
                path: "answer", // Populate the answer array
                populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
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
          userId: user.id,
          eventId: id,
        });
        data.isLike = isLike ? true : false;
        const isFavorite = await EventFavorites.findOne({
          userId: user.id,
          eventId: id,
        });
        data.isFavorite = isFavorite ? true : false;
        const isJoin = await EventParticipants.findOne({
          userId: user.id,
          eventId: id,
        });
        const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
        const eventTime = new Date(data.started_time);
        const dateNow = new Date(timeMoscow);
        console.log("eventtime", eventTime);
        console.log("datenow", dateNow);

        const timeDifference = eventTime - dateNow;
        // const timeDifference = data.started_time - timeMoscow;

        // Convert milliseconds to minutes
        const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

        if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
          data.hour = true;
          console.log("The start time is less than an hour away.");
        }
        //  else if (differenceInMinutes <= 0) {
        //   console.log("The start time has already passed.");
        // } else {
        //   console.log("The start time is more than an hour away.");
        // }
        if (isJoin) {
          data.joinStatus = 2;

          // const now = new Date();

          // const formattedDate =
          //   now.getFullYear() +
          //   "-" +
          //   String(now.getMonth() + 1).padStart(2, "0") +
          //   "-" +
          //   String(now.getDate()).padStart(2, "0") +
          //   " " +
          //   String(now.getHours()).padStart(2, "0") +
          //   ":" +
          //   String(now.getMinutes()).padStart(2, "0") +
          //   ":" +
          //   String(now.getSeconds()).padStart(2, "0");

          // Example start time (you can change it to any date and time you want)
          // const startTime = new Date(data.started_time);
          // const nowDate = new Date(formattedDate); // Use the desired start time in ISO format
          // console.log(nowDate, "nowDate");
        }

        const isSpot = await EventParticipantsSpot.findOne({
          userId: user.id,
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
            $set: { ratingCalculated: averageRating }, // Set new rating
          },
          { new: true }
        )
          .populate("owner")
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
              { path: "user", select: "_id name surname avatar" }, // Populate userId in comments
              {
                path: "answer", // Populate the answer array
                populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
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
          userId: user.id,
          eventId: id,
        });
        data.isLike = isLike ? true : false;
        const isFavorite = await EventFavorites.findOne({
          userId: user.id,
          eventId: id,
        });
        data.isFavorite = isFavorite ? true : false;
        const isJoin = await EventParticipants.findOne({
          userId: user.id,
          eventId: id,
        });
        const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");

        const eventTime = new Date(data.started_time);
        const dateNow = new Date(timeMoscow);
        console.log("eventtime", eventTime);
        console.log("datenow", dateNow);

        const timeDifference = eventTime - dateNow;
        console.log("timedifference", timeDifference);

        // Convert milliseconds to minutes
        const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

        if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
          data.hour = true;
          console.log("The start time is less than an hour away.");
        }
        // else if (differenceInMinutes <= 0) {
        //   hour=false
        //   console.log("The start time has already passed.");
        // } else {
        //   hour=false
        //   console.log("The start time is more than an hour away.");
        // }
        if (isJoin) {
          data.joinStatus = 2;
        }

        const isSpot = await EventParticipantsSpot.findOne({
          userId: user.id,
          eventId: id,
        });
        if (isSpot) {
          data.joinStatus = 3;
        }
        res.status(200).send({ message: "success", data });
      }
    } else {
      const resDb = await Event.findById(id);
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
          $set: { ratingCalculated: averageRating }, // Set new rating
        },
        { new: true }
      )
        .populate("owner")
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
            { path: "user", select: "_id name surname avatar" }, // Populate userId in comments
            {
              path: "answer", // Populate the answer array
              populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
            },
          ],
        })
        .exec();
      const timeMoscow = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
      const eventTime = new Date(data.started_time);
      const dateNow = new Date(timeMoscow);
      console.log("eventtime", eventTime);
      console.log("datenow", dateNow);

      const timeDifference = eventTime - dateNow;
      // const timeDifference = data.started_time - timeMoscow;

      // Convert milliseconds to minutes
      const differenceInMinutes = timeDifference / 60000; // 60000 ms in one minute

      if (differenceInMinutes > 0 && differenceInMinutes <= 60) {
        data.hour = true;
        console.log("The start time is less than an hour away.");
      }
      //  else if (differenceInMinutes <= 0) {
      //   hour=false
      //   console.log("The start time has already passed.");
      // } else {
      //   hour=false
      //   console.log("The start time is more than an hour away.");
      // }
      res.status(200).send({ message: "success", data });
    }

    // return res.json(data);
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
      if (authHeader&&authHeader!=="null") {
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
            // const eventDate = new Date(event.started_time);
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
        result.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });
  
        // separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
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
            // const eventDate = new Date(event.started_time);
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
        result.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });
  
        // separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        result.sort((a, b) => a.kilometr - b.kilometr);
        return res.status(200).send(result);
      }
    } catch (error) {
      console.log(error);
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
        console.log("authHeader-event-allFilter", authHeader);
        
        const token = authHeader.split(" ")[1];
        console.log("token", token);
        
        const user = jwt.decode(token);
        console.log("user", user);
        
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].avatar;
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
          categoryArray.unshift(objNew);
        }
        resultObj.category = categoryArray;
        return res.status(200).send(resultObj);

        /////////////////////////////////////////
       
      } else {
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].avatar;
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
          categoryArray.unshift(objNew);
        }
        resultObj.category = categoryArray;

        return res.status(200).send(resultObj);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  };
  radius = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { lon, lan } = req.body;


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

      const myLatitude = lan;
      const myLongitude = lon;

      if (!authHeader) {
        const pointsOfInterest = await Event.find();

        pointsOfInterest.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
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
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
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
    const db = await Event.findById("64ca48e2d8cb04f976150cf6");
    notifEvent.emit(
      "send",
      "ADMIN",
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
      const { lon, lan } = req.body;
      if (authHeader&&authHeader!=="null") {
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
            userId: user.id,
          });
          const participantSpot = await EventParticipantsSpot.findOne({
            eventId: result.upcoming[z]._id,
            userId: user.id,
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
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });


        result.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        // passed.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({
          message: "success",
          upcoming: result.upcoming,
          // passed: result.passed,
        });
      } else {
        const events = await Event.find({ status: 1 })
          .populate({ path: "category", select: "avatar name map_avatar" })
          .populate({ path: "images", select: "name" });
        console.log(events, "events");

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
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });
        result.passed.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.location.coordinates[0],
            meeting.location.coordinates[1]
          );
        });

        result.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        result.passed.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({
          message: "success",
          upcoming: result.upcoming,
          passed: result.passed,
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
            userId: user.id,
            eventId: id,
            date: moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          });
          await participant.save();
          const result = await Event.findByIdAndUpdate(id, {
            $push: { participants: participant._id },
          });
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
            userId: user.id,
            eventId: id,
          });
          await participantSpot.save();
          const result = await Event.findByIdAndUpdate(id, {
            $push: { participantsSpot: participantSpot._id },
          });
          return res.status(200).send({ message: "success" });
        } else {
          return res.status(401).send({ message: "Event not found" });
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
