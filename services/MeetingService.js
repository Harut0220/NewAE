import mongoose from "mongoose";
import meetingImages from "../models/meeting/meetingImages.js";
// import meetingImages from "../models/meeting/meetingImages.js";
import meetingModel from "../models/meeting/meetingModel.js";
import meetingVerify from "../models/meeting/meetingVerify.js";
import MeetingVerify from "../models/meeting/meetingVerify.js";
import MeetingParticipants from "../models/meeting/meetingParticipant.js";
import User from "../models/User.js";
import meetingFavorit from "../models/meeting/meetingFavorit.js";
// import moment from "moment";
import jwt from "jsonwebtoken";
// import meetingComment from "../models/meeting/meetingComment.js";
import Role from "../models/Role.js";
import NotificatationList from "../models/NotificationList.js";
import Notification from "../models/Notification.js";
import UserService from "./UserService.js";
import NotificationService from "./NotificationService.js";
import notifEvent from "../events/NotificationEvent.js";
import meetingCommentLikes from "../models/meeting/meetingCommentLikes.js";
import meetingLikes from "../models/meeting/meetingLikes.js";
import MeetingViews from "../models/meeting/meetingView.js";
import moment from "moment-timezone";
import meetingParticipant from "../models/meeting/meetingParticipant.js";
import meetingCommentAnswer from "../models/meeting/meetingCommentAnswer.js";
import meetingRating from "../models/meeting/meetingRating.js";
import MeetingAnswerLikes from "../models/meeting/meetingCommentAnswerLike.js";
import meetingParticipantSpot from "../models/meeting/meetingParticipantSpot.js";
import e from "express";
import meetingComment from "../models/meeting/meetingComment.js";
import meetingView from "../models/meeting/meetingView.js";
import companyModel from "../models/company/companyModel.js";

const meetingService = {
    myParticipant : async (userId) => {
      try {
        const meetings=await meetingParticipant.find({userId}).populate({
          path: 'meetingId',        // Populates eventId
          populate: [
            { path: 'images' },    // Populates images inside eventId    // Populates likes inside eventId
          ]
        })
        .exec();
        const resArray=[];
        for(let i=0;i<meetings.length;i++){
          resArray.push(meetings[i].meetingId);
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

            if (event.date > dateNow) {
              upcoming.push(event);
            } else {
              console.log("passed");

              passed.push(event);
            }
          });


          return { upcoming, passed };
        }


        const upcomPass=separateUpcomingAndPassed(resArray);
        const data={}
        data.upcoming=upcomPass.upcoming
        data.passed=upcomPass.passed
        return ({message:"success",data});
      } catch (error) {
        console.error(error);
        return false
      }

  },
  destroyVerify: async (des_events) => {
    if (Array.isArray(des_events)) {
      for (let i = 0; i < des_events.length; i++) {
        const meeting = await meetingVerify.findById(des_events[i]);
        if (!meeting) {
          throw new Error("Meeting not found");
        }
        await meeting.remove();
        console.log("Meetings and all related data deleted successfully");
      }
    }
    if (typeof (des_events) === "string") {
      const meeting = await meetingVerify.findById(des_events);
      if (!meeting) {
        throw new Error("Meeting not found");
      }
      await meeting.remove();
      console.log("Meetings and all related data deleted successfully");
    }
    return ({ message: "success" });
  },
  destroy: async (des_events) => {

    if (Array.isArray(des_events)) {
      for (let i = 0; i < des_events.length; i++) {
        const meeting = await meetingModel.findById(des_events[i]);

        if (!meeting) {
          throw new Error("Meeting not found");
        }

        // Find all related comments
        const comments = await meetingComment.find({
          meetingId: des_events[i],
        });

        // For each comment, delete related answers and likes
        for (const comment of comments) {
          // Delete all likes related to the comment
          await meetingCommentLikes.deleteMany({ commentId: comment._id });

          // Find all answers related to the comment
          const answers = await meetingCommentAnswer.find({
            commentId: comment._id,
          });

          // For each answer, delete related likes
          for (const answer of answers) {
            await MeetingAnswerLikes.deleteMany({ answerId: answer._id });
          }

          // Delete all answers related to the comment
          await meetingCommentAnswer.deleteMany({ commentId: comment._id });
        }

        // Delete all comments related to the meeting
        await meetingComment.deleteMany({ meetingId: des_events[i] });
        await meetingImages.deleteMany({ meetingId: des_events[i] });
        await meetingLikes.deleteMany({ meetingId: des_events[i] });
        await meetingFavorit.deleteMany({ meetingId: des_events[i] });
        await meetingParticipantSpot.deleteMany({ meetingId: des_events[i] });
        await meetingView.deleteMany({ meetingId: des_events[i] });
        await meetingRating.deleteMany({ meetingId: des_events[i] });
        await meetingParticipant.deleteMany({ meetingId: des_events[i] });

        await meeting.remove();
        console.log("Meetings and all related data deleted successfully");

      }
    }
    if (typeof (des_events)==="string") {
      const meeting = await meetingModel.findById(des_events);

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Find all related comments
      const comments = await meetingComment.find({ meetingId: des_events });

      // For each comment, delete related answers and likes
      for (const comment of comments) {
        // Delete all likes related to the comment
        await meetingCommentLikes.deleteMany({ commentId: comment._id });

        // Find all answers related to the comment
        const answers = await meetingCommentAnswer.find({
          commentId: comment._id,
        });

        // For each answer, delete related likes
        for (const answer of answers) {
          await MeetingAnswerLikes.deleteMany({ answerId: answer._id });
        }

        // Delete all answers related to the comment
        await meetingCommentAnswer.deleteMany({ commentId: comment._id });
      }

      // Delete all comments related to the meeting
      await meetingComment.deleteMany({ meetingId: des_events });
      await meetingImages.deleteMany({ meetingId: des_events });
      await meetingLikes.deleteMany({ meetingId: des_events });
      await meetingFavorit.deleteMany({ meetingId: des_events });
      await meetingParticipantSpot.deleteMany({ meetingId: des_events });
      await meetingView.deleteMany({ meetingId: des_events });
      await meetingRating.deleteMany({ meetingId: des_events });
      await meetingParticipant.deleteMany({ meetingId: des_events });

      await meeting.remove();

      console.log("Meeting and all related data deleted successfully");
    }
    return { message: "success" };
  },
  meetingsTest: async (userId) => {
    const meetings = await meetingModel
      .find({ userId: { $ne: userId } })
      .populate("userId")
      .populate("participants")
      .populate("images")
      .populate("participantSpot")
      .populate("view")
      .populate({
        path: "ratings",
        populate: { path: "userId", select: "name surname avatar" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "userId", select: "name surname avatar" }, // Populate userId in comments
          {
            path: "answer", // Populate the answer array
            populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
          },
        ],
      })
      .exec();
    for (let i = 0; i < meetings.length; i++) {
      const isRating = await meetingRating.findOne({
        meetingId: meetings[i]._id,
        userId: userId,
      });
      meetings[i].isRating = isRating ? true : false;
      const findLike = await meetingLikes.findOne({
        meetingId: meetings[i]._id,
        userId: userId,
      });
      meetings[i].isLike = findLike ? true : false;
      const findFavorite = await meetingFavorit.findOne({
        meetingId: meetings[i]._id,
        userId: userId,
      });
      meetings[i].isFavorite = findFavorite ? true : false;
    }
    function separateUpcomingAndPassed(events) {
      // const now = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
      const upcoming = [];
      const passed = [];

      events.forEach((event) => {
        // const eventDate = new Date(event.date);
        if (event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")) {
          upcoming.push(event);
        } else {
          passed.push(event);
        }
      });

      return { upcoming, passed };
    }
    const separatedEvents = separateUpcomingAndPassed(meetings);
    // console.log("Upcoming Events:", separatedEvents.upcoming);
    // console.log("Passed Events:", separatedEvents.passed);
    const filter = separatedEvents.passed.filter((event) => event.status === 1);
    return {
      message: "success",
      upcoming: separatedEvents.upcoming,
      passed: filter,
    };
  },
  meetings: async (authHeader, lon, lan) => {
    console.log(typeof (authHeader));
    
    if (authHeader && authHeader!=="null"&& lon && lan) {
      console.log("authHeader", authHeader, "lon", lon, "lan", lan);
      
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const userId = user.id;
      const myLatitude = lan;
      const myLongitude = lon;

      // Function to calculate distance between two points using Haversine formula
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
      const meetings = await meetingModel
        .find({ userId: { $ne: user.id }, status: { $eq: 1 } })
        .populate("userId")
        .populate("participants")
        .populate("images")
        .populate("participantSpot")
        .populate("view")
        .populate({
          path: "ratings",
          populate: { path: "userId", select: "name surname avatar" },
        })
        .populate({
          path: "comments",
          populate: [
            { path: "userId", select: "name surname avatar" }, // Populate userId in comments
            {
              path: "answer", // Populate the answer array
              populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
            },
          ],
        })
        .exec();
      for (let i = 0; i < meetings.length; i++) {
        const isRating = await meetingRating.findOne({
          meetingId: meetings[i]._id,
          userId: userId,
        });
        meetings[i].isRating = isRating ? true : false;
        const findLike = await meetingLikes.findOne({
          meetingId: meetings[i]._id,
          userId: userId,
        });
        meetings[i].isLike = findLike ? true : false;
        const findFavorite = await meetingFavorit.findOne({
          meetingId: meetings[i]._id,
          userId: userId,
        });
        meetings[i].isFavorite = findFavorite ? true : false;
      }
      function separateUpcomingAndPassed(events) {
        const now = new Date();
        const upcoming = [];
        const passed = [];

        events.forEach((event) => {
          // const eventDate = new Date();
          if (
            event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
          ) {
            upcoming.push(event);
          } else {
            passed.push(event);
          }
        });

        return { upcoming, passed };
      }
      const separatedEvents = separateUpcomingAndPassed(meetings);
      // console.log("Upcoming Events:", separatedEvents.upcoming);
      // console.log("Passed Events:", separatedEvents.passed);
      const filter = separatedEvents.passed.filter(
        (event) => event.status === 1
      );
      separatedEvents.upcoming.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Sort the companies array by distance (kilometr)
      separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
      return {
        message: "success",
        upcoming: separatedEvents.upcoming,
        passed: filter,
      };
    } else if (!authHeader && lon && lan) {
      const myLatitude = lan;
      const myLongitude = lon;

      // Function to calculate distance between two points using Haversine formula
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
      const meetings = await meetingModel
        .find({ status: { $eq: 1 } })
        .populate("userId")
        .populate("participants")
        .populate("images")
        .populate("participantSpot")
        .populate("view")
        .populate({
          path: "ratings",
          populate: { path: "userId", select: "name surname avatar" },
        })
        .populate({
          path: "comments",
          populate: [
            { path: "userId", select: "name surname avatar" }, // Populate userId in comments
            {
              path: "answer", // Populate the answer array
              populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
            },
          ],
        })
        .exec();
      // for (let i = 0; i < meetings.length; i++) {
      //   const findLike = await meetingLikes.findOne({
      //     meetingId: meetings[i]._id,
      //     userId: userId,
      //   });
      //   meetings[i].isLike = findLike ? true : false;
      //   const findFavorite = await meetingFavorit.findOne({
      //     meetingId: meetings[i]._id,
      //     userId: userId,
      //   });
      //   meetings[i].isFavorite = findFavorite ? true : false;
      // }
      function separateUpcomingAndPassed(events) {
        // const now = new Date();
        const upcoming = [];
        const passed = [];

        events.forEach((event) => {
          // const eventDate = new Date();
          if (
            event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
          ) {
            upcoming.push(event);
          } else {
            passed.push(event);
          }
        });

        return { upcoming, passed };
      }
      const separatedEvents = separateUpcomingAndPassed(meetings);
      // console.log("Upcoming Events:", separatedEvents.upcoming);
      // console.log("Passed Events:", separatedEvents.passed);
      const filter = separatedEvents.passed.filter(
        (event) => event.status === 1
      );
      separatedEvents.upcoming.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Sort the companies array by distance (kilometr)
      separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
      return {
        message: "success",
        upcoming: separatedEvents.upcoming,
        passed: filter,
      };
    } else if (!authHeader && lon === "undefined" && lan === "undefined") {
      const myLatitude = 55.7558;
      const myLongitude = 37.6173;

      // Function to calculate distance between two points using Haversine formula
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
      const meetings = await meetingModel
        .find({ status: { $eq: 1 } })
        .populate("userId")
        .populate("participants")
        .populate("images")
        .populate("participantSpot")
        .populate("view")
        .populate({
          path: "ratings",
          populate: { path: "userId", select: "name surname avatar" },
        })
        .populate({
          path: "comments",
          populate: [
            { path: "userId", select: "name surname avatar" }, // Populate userId in comments
            {
              path: "answer", // Populate the answer array
              populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
            },
          ],
        })
        .exec();
      // for (let i = 0; i < meetings.length; i++) {
      //   const findLike = await meetingLikes.findOne({
      //     meetingId: meetings[i]._id,
      //     userId: userId,
      //   });
      //   meetings[i].isLike = findLike ? true : false;
      //   const findFavorite = await meetingFavorit.findOne({
      //     meetingId: meetings[i]._id,
      //     userId: userId,
      //   });
      //   meetings[i].isFavorite = findFavorite ? true : false;
      // }
      function separateUpcomingAndPassed(events) {
        // const now = new Date();
        const upcoming = [];
        const passed = [];

        events.forEach((event) => {
          // const eventDate = new Date();
          if (
            event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
          ) {
            upcoming.push(event);
          } else {
            passed.push(event);
          }
        });

        return { upcoming, passed };
      }
      const separatedEvents = separateUpcomingAndPassed(meetings);
      // console.log("Upcoming Events:", separatedEvents.upcoming);
      // console.log("Passed Events:", separatedEvents.passed);
      const filter = separatedEvents.passed.filter(
        (event) => event.status === 1
      );
      separatedEvents.upcoming.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Sort the companies array by distance (kilometr)
      separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
      return {
        message: "success",
        upcoming: separatedEvents.upcoming,
        passed: filter,
      };
    } else if (authHeader && authHeader!=="null"&& lon === "undefined" && lan === "undefined") {
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const myLatitude = 55.7558;
      const myLongitude = 37.6173;

      // Function to calculate distance between two points using Haversine formula
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
      const meetings = await meetingModel
        .find({ userId: { $ne: user.id }, status: { $eq: 1 } })
        .populate("userId")
        .populate("participants")
        .populate("images")
        .populate("participantSpot")
        .populate("view")
        .populate({
          path: "ratings",
          populate: { path: "userId", select: "name surname avatar" },
        })
        .populate({
          path: "comments",
          populate: [
            { path: "userId", select: "name surname avatar" }, // Populate userId in comments
            {
              path: "answer", // Populate the answer array
              populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
            },
          ],
        })
        .exec();
      for (let i = 0; i < meetings.length; i++) {
        const isRating = await meetingRating.findOne({
          meetingId: meetings[i]._id,
          userId: userId,
        });
        meetings[i].isRating = isRating ? true : false;
        const findLike = await meetingLikes.findOne({
          meetingId: meetings[i]._id,
          userId: user.id,
        });
        meetings[i].isLike = findLike ? true : false;
        const findFavorite = await meetingFavorit.findOne({
          meetingId: meetings[i]._id,
          userId: user.id,
        });
        meetings[i].isFavorite = findFavorite ? true : false;
      }
      function separateUpcomingAndPassed(events) {
        // const now = new Date();
        const upcoming = [];
        const passed = [];

        events.forEach((event) => {
          // const eventDate = new Date();
          if (
            event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
          ) {
            upcoming.push(event);
          } else {
            passed.push(event);
          }
        });

        return { upcoming, passed };
      }
      const separatedEvents = separateUpcomingAndPassed(meetings);
      // console.log("Upcoming Events:", separatedEvents.upcoming);
      // console.log("Passed Events:", separatedEvents.passed);
      const filter = separatedEvents.passed.filter(
        (event) => event.status === 1
      );
      separatedEvents.upcoming.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Sort the companies array by distance (kilometr)
      separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
      return {
        message: "success",
        upcoming: separatedEvents.upcoming,
        passed: filter,
      };
    } else {
      return {
        message: "error",
        upcoming: [],
        passed: [],
      };
    }
  },
  deleteCommentAnswer: async (answerId) => {
    const commentDb = await meetingComment.findByIdAndUpdate(answerId, {
      $pull: { answer: answerId },
    });
    const commentAnswerDb = await meetingCommentAnswer.findById(answerId);
    await commentAnswerDb.remove();
    const commentAnswerLikesDb = await AnswerLikes.find({
      answerId,
    });
    await commentAnswerLikesDb.remove();
    return { message: "Комментарий удален" };
  },
  commentAnswerLike: async (userId, answerId, commentId) => {
    const commentAnswerLikesDb = await AnswerLikes.find({
      user: userId,
      answerId,
      commentId,
    });
    if (!commentAnswerLikesDb.length) {
      function getFormattedDate() {
        const date = new Date();

        const pad = (n) => n.toString().padStart(2, "0"); // Helper function to pad numbers to 2 digits

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1); // Months are zero-indexed, so we add 1
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        const milliseconds = date.getMilliseconds().toString().padStart(3, "0"); // Pad milliseconds to 3 digits

        // Timezone offset in minutes, and converting it to hours and minutes
        const tzOffset = date.getTimezoneOffset();
        const tzSign = tzOffset > 0 ? "-" : "+";
        const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
        const tzMinutes = pad(Math.abs(tzOffset) % 60);

        // Constructing the final string in the desired format
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${tzSign}${tzHours}:${tzMinutes}`;
      }
      const commentAnswerLikesDb = new AnswerLikes({
        user: userId,
        answerId,
        date: moment.tz(process.env.TZ).format(),
      });
      const commentAnswerDb = await meetingCommentAnswer.findByIdAndUpdate(
        answerId,
        { $push: { likes: commentAnswerLikesDb._id } }
      );
      await commentAnswerLikesDb.save();
      return { message: "Лайк добавлен" };
    } else {
      const commentAnswerLikesDb = await AnswerLikes.findById(
        commentAnswerLikesDb[0]._id
      );
      await commentAnswerLikesDb.remove();
      const commentAnswerDb = await meetingCommentAnswer.findByIdAndUpdate(
        answerId,
        { $pull: { likes: commentAnswerLikesDb._id } }
      );
      return { message: "Лайк удаленно" };
    }
  },
  addRating: async (userId, meetingId, rating) => {
    const ratingIf = await meetingRating.find({ userId, meetingId });
    if (!ratingIf.length) {
      const date = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss");
      const meetingRatingDb = new meetingRating({
        userId,
        meetingId,
        rating,
        date,
      });
      await meetingRatingDb.save();
      const meetingDb = await meetingModel.findByIdAndUpdate(
        meetingId,
        { $push: { ratings: meetingRatingDb._id } },
        { new: true }
      );
      return { message: "Рейтинг добавлен" };
    } else {
      return { message: "Рейтинг уже добавлен" };
    }
  },
  deleteComment: async (id) => {
    const commentDb = await meetingComment.findById(id);
    await commentDb.remove();
    const commentAnswerDb = await meetingCommentAnswer.find({ commentId: id });
    await commentAnswerDb.remove();
    const commentLikesDb = await meetingCommentLikes.find({ commentId: id });
    await commentLikesDb.remove();
    const commentAnswerLikesDb = await AnswerLikes.find({
      answerId: commentAnswerDb[0]._id,
    });
    await commentAnswerLikesDb.remove();
    const meetingDb = await meetingModel.findByIdAndUpdate(
      commentDb.meetingId,
      { $pull: { comments: commentDb._id } }
    );
    return { message: "Комментарий удален" };
  },
  commentAnswer: async (userId, commentId, text) => {
    const date = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss");
    const commentAnswerDb = new meetingCommentAnswer({
      userId,
      commentId,
      text,
      date,
    });
    await commentAnswerDb.save();
    const commentDb = await meetingComment.findByIdAndUpdate(
      commentId,
      { $push: { answer: commentAnswerDb._id } },
      { new: true }
    );
    return { message: "Комментарий добавлен", answer: commentAnswerDb };
  },
  participantSpot: async (userId, meetingId) => {
    const resIf = await meetingParticipant.find({ userId, meetingId });
    if (resIf.length) {
      const spotDb = new meetingParticipantSpot({ userId, meetingId });
      await spotDb.save();
      const updatedMeeting = await meetingModel
        .findByIdAndUpdate(
          meetingId,
          { $push: { participantSpot: userId } }, // Push the new participant to participantSpot array
          { new: true } // Return the updated document
        )
        .populate("images")
        .populate("userId")
        .populate("participants")
        .populate("comments")
        .populate("likes")
        .populate("participantSpot");
      // console.log("updatedMeeting", updatedMeeting);

      return { message: "Вас добавлен в список на место" };
    }
    return { message: "Вас нет в списке участников" };
  },
  single: async (id, userId) => {
    const result = await meetingModel
      .findById(id)
      .populate("userId")
      .populate("participants")
      .populate("likes")
      .populate("images")
      .populate("participantSpot")
      .populate("view")
      .populate("favorites")
      .populate({
        path: "ratings",
        populate: { path: "userId", select: "name surname avatar" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "userId", select: "name surname avatar" }, // Populate userId in comments
          {
            path: "answer", // Populate the answer array
            populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
          },
        ],
      })
      .exec();

    function calculateAverageRating(ratings) {
      if (ratings.length === 0) return 0;

      // Sum all the ratings
      const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

      // Calculate the average
      const average = total / ratings.length;

      // Optionally, round to a certain number of decimal places
      return Math.round(average * 10) / 10; // Rounds to 1 decimal place
    }

    // Calculate and display the average rating
    const averageRating = calculateAverageRating(result.ratings);
    const resultChanged1 = await meetingModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: { ratingCalculated: averageRating }, // Set new rating
        },
        { new: true } // Return the updated document
      )
      .populate({ path: "userId", select: "name surname avatar" })
      .populate("participants")
      .populate("likes")
      .populate("images")
      .populate("participantSpot")
      .populate("view")
      .populate("favorites")
      .populate({
        path: "ratings",
        populate: { path: "userId", select: "name surname avatar" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "userId", select: "name surname avatar" }, // Populate userId in comments
          {
            path: "answer", // Populate the answer array
            populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
          },
        ],
      })
      .exec();
    for (let i = 0; i < resultChanged1.length; i++) {
      const isRating = await meetingRating.findOne({
        meetingId: resultChanged1[i]._id,
        userId: userId,
      });
      resultChanged1[i].isRating = isRating ? true : false;
      const findLike = await meetingLikes.findOne({
        meetingId: resultChanged1[i]._id,
        userId: userId,
      });
      resultChanged1[i].isLike = findLike ? true : false;
      const findFavorite = await meetingFavorit.findOne({
        meetingId: resultChanged1[i]._id,
        userId: userId,
      });
      resultChanged1[i].isFavorite = findFavorite ? true : false;
    }
    return resultChanged1;
  },
  myMeeting: async (authHeader) => {
    try {
      if (authHeader&&authHeader!=="null") {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        // const user = { id: "656ecb2e923c5a66768f4cd3" };
        const userId = user.id;
        const resDb = await meetingModel
          .find({ userId, status: { $ne: 2 } })
          .populate("userId")
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate("participantSpot")
          .populate("view")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "userId", select: "name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "userId", select: "name surname avatar" }, // Populate userId in comments
              {
                path: "answer", // Populate the answer array
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
          // const currentDate = moment();
          pastLikes = resDb[i].likes.filter((like) => {
            const parsedGivenDate = moment(like.date);
            // console.log("like.date)",like.date);

            // console.log("parsedGivenDate",parsedGivenDate);

            // console.log("parsedGivenDate.isAfter(resDb[i].changedStatusDate)",parsedGivenDate.isAfter(resDb[i].changedStatusDate));
            // console.log("resDb[i].changedStatusDate",resDb[i].changedStatusDate);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });

          pastComment = resDb[i].comments.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });
          // console.log("pastComment", pastComment);

          view = resDb[i].view.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });
          // console.log("view", view);

          favorites = resDb[i].favorites.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });
          // console.log("favorites", favorites);

          pastParticipants = resDb[i].participants.filter((like) => {
            const parsedGivenDate = moment(like.date);

            return parsedGivenDate.isAfter(resDb[i].changedStatusDate);
          });
          // console.log("pastParticipants", pastParticipants);

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

        // const resDbres=await meetingModel.find({userId,status: { $ne: 2 } }).populate("userId").populate("participants").populate("comments").populate("likes").populate("images").populate("participantSpot");

        function separateUpcomingAndPassed(events) {
          // const now = new Date();
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            // const eventDate = new Date();
            if (
              event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
            ) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }
        // console.log(resDb,"resDb");

        const separatedEvents = separateUpcomingAndPassed(resDb);
        // console.log("Upcoming Events:", separatedEvents.upcoming);
        // console.log("Passed Events:", separatedEvents.passed);
        const filter = separatedEvents.passed.filter(
          (event) => event.status === 1
        );
        let passed = [];
        for (let i = 0; i < filter.length; i++) {
          for (let j = 0; j < filter[i].participants.length; j++) {
            // console.log("filter[i].participants[j]._id===userId",ifpass===userId);
            // console.log("filter[i].participants[j]._id",ifpass);
            // console.log("userId",userId);

            if (filter[i].participants[j]._id.toString() === userId) {
              passed.push(filter[i]);
            }
          }
        }
        // console.log("passednew",passed);

        const dateChange = await meetingModel.find({ userId });
  

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
        const myLatitude = 55.7558
        const myLongitude = 37.6176 
        separatedEvents.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.lan,
            meeting.lon
          );
        });
        passed.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.lan,
            meeting.lon
          );
        });


        separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        passed.sort((a, b) => a.kilometr - b.kilometr);


        return {
          message: "success",
          upcoming: separatedEvents.upcoming,
          passed,
          count: countAll,
        };
      } else {
        const resDb = await meetingModel
          .find({ status: { $ne: 2 } })
          .populate("userId")
          .populate("participants")
          .populate("comments")
          .populate("likes")
          .populate("images")
          .populate("participantSpot");
        function separateUpcomingAndPassed(events) {
          // const now = new Date();
          const upcoming = [];
          const passed = [];

          events.forEach((event) => {
            // const eventDate = new Date(event.date);
            if (
              event.date > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")
            ) {
              upcoming.push(event);
            } else {
              passed.push(event);
            }
          });

          return { upcoming, passed };
        }
        const separatedEvents = separateUpcomingAndPassed(resDb);
        
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

        separatedEvents.upcoming.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.lan,
            meeting.lon
          );
        });
        separatedEvents.passed.forEach((meeting) => {
          meeting.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            meeting.lan,
            meeting.lon
          );
        });


        separatedEvents.upcoming.sort((a, b) => a.kilometr - b.kilometr);
        separatedEvents.passed.sort((a, b) => a.kilometr - b.kilometr);
        return {
          message: "success",
          upcoming: separatedEvents.upcoming,
          passed: separatedEvents.passed,
          // count: countAll,
        };
      }
    } catch (error) {
      console.error(error);
    }
  },
  allMeeting: async (authHeader, lon, lan) => {
    if (authHeader&&authHeader!=="null"&&lon&&lan) {
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const meetings = await meetingModel
        .find({ userId: { $ne: user.id } })
        .populate("images")
        .populate("userId")
        .populate("participants")
        .populate("comments")
        .populate("likes");
      console.log("ne meeting", meetings.length);
      /////////////////////////////////////////////////////////////

      // Function to calculate distance between two points using Haversine formula
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

      // Function to filter points within a specified radius from a center point
      // function pointsWithinRadius(centerLat, centerLon, points, radius) {
      //   // console.log(points);

      //   const filteredPoints = points.filter((point) => {
      //     // console.log("points.coords.longit",points.coords);
      //     // console.log("points.coords.latit",points.coords);

      //     const distance = calculateDistance(
      //       centerLat,
      //       centerLon,
      //       point.lan,
      //       point.lon
      //     );
      //     point.kilometr = distance;
      //     // console.log("distance",distance);

      //     return distance <= radius;
      //   });

      //   return filteredPoints;
      // }
      // const pointsOfInterest = await meetingModel.find();
      // console.log("pointsOfInterest",pointsOfInterest);

      const myLatitude = lan;
      const myLongitude = lon;

      // const radiusInKm = 2;

      // const pointsWithinOneKm = pointsWithinRadius(
      //   myLatitude,
      //   myLongitude,
      //   meetings,
      //   radiusInKm
      // );

      meetings.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Output the points within the radius
      // console.log(
      //   `Points within ${radiusInKm} kilometer radius of (${myLatitude}, ${myLongitude}):`
      // );
      // const arrResult = [];
      // pointsWithinOneKm.forEach((point) => {
      //   arrResult.push(point);
      //   // console.log(
      //   //   `${point.name}: (${point.location.coordinates[0]}, ${point.location.coordinates[1]})`
      //   // );
      // });
      

      // res.status(200).send(arrResult);
      ///////////////////////////////////////////////////////////
      meetings.sort((a, b) => a.kilometr - b.kilometr);
      return { message: "success", data: meetings };
    } else if(!authHeader&&lon&&lan){
      const meetings = await meetingModel
        .find()
        .populate("images")
        .populate("userId")
        .populate("participants")
        .populate("comments")
        .populate("likes")
        .populate("images");
      console.log("all meeting", meetings.length);
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

      // Function to filter points within a specified radius from a center point
      // function pointsWithinRadius(centerLat, centerLon, points, radius) {
      //   // console.log(points);

      //   const filteredPoints = points.filter((point) => {
      //     // console.log("points.coords.longit",points.coords);
      //     // console.log("points.coords.latit",points.coords);

      //     const distance = calculateDistance(
      //       centerLat,
      //       centerLon,
      //       point.lan,
      //       point.lon
      //     );
      //     point.kilometr = distance;
      //     // console.log("distance",distance);

      //     return distance <= radius;
      //   });

      //   return filteredPoints;
      // }
      // const pointsOfInterest = await meetingModel.find();
      // console.log("pointsOfInterest",pointsOfInterest);

      const myLatitude = lan;
      const myLongitude = lon;

      meetings.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      meetings.sort((a, b) => a.kilometr - b.kilometr);
      // const radiusInKm = 2;

      // const pointsWithinOneKm = pointsWithinRadius(
      //   myLatitude,
      //   myLongitude,
      //   meetings,
      //   radiusInKm
      // );

      // Output the points within the radius
      // console.log(
      //   `Points within ${radiusInKm} kilometer radius of (${myLatitude}, ${myLongitude}):`
      // );
      // const arrResult = [];
      // pointsWithinOneKm.forEach((point) => {
      //   arrResult.push(point);
      //   // console.log(
      //   //   `${point.name}: (${point.location.coordinates[0]}, ${point.location.coordinates[1]})`
      //   // );
      // });

      // res.status(200).send(arrResult);
      ///////////////////////////////////////////////////////////

      return { message: "success", data: meetings };
    }else if(authHeader&&authHeader!=="null"&&!lon&&!lan){
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const meetings = await meetingModel
        .find({ userId: { $ne: user.id } })
        .populate("images")
        .populate("userId")
        .populate("participants")
        .populate("comments")
        .populate("likes");
      console.log("ne meeting", meetings.length);
      /////////////////////////////////////////////////////////////

      // Function to calculate distance between two points using Haversine formula
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

      // Function to filter points within a specified radius from a center point
      // function pointsWithinRadius(centerLat, centerLon, points, radius) {
      //   // console.log(points);

      //   const filteredPoints = points.filter((point) => {
      //     // console.log("points.coords.longit",points.coords);
      //     // console.log("points.coords.latit",points.coords);

      //     const distance = calculateDistance(
      //       centerLat,
      //       centerLon,
      //       point.lan,
      //       point.lon
      //     );
      //     point.kilometr = distance;
      //     // console.log("distance",distance);

      //     return distance <= radius;
      //   });

      //   return filteredPoints;
      // }
      // const pointsOfInterest = await meetingModel.find();
      // console.log("pointsOfInterest",pointsOfInterest);

      const myLatitude = 55.7558;
      const myLongitude = 37.6173;

      // const radiusInKm = 2;

      // const pointsWithinOneKm = pointsWithinRadius(
      //   myLatitude,
      //   myLongitude,
      //   meetings,
      //   radiusInKm
      // );

      meetings.forEach((meeting) => {
        meeting.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          meeting.lan,
          meeting.lon
        );
      });

      // Output the points within the radius
      // console.log(
      //   `Points within ${radiusInKm} kilometer radius of (${myLatitude}, ${myLongitude}):`
      // );
      // const arrResult = [];
      // pointsWithinOneKm.forEach((point) => {
      //   arrResult.push(point);
      //   // console.log(
      //   //   `${point.name}: (${point.location.coordinates[0]}, ${point.location.coordinates[1]})`
      //   // );
      // });
      

      // res.status(200).send(arrResult);
      ///////////////////////////////////////////////////////////
      meetings.sort((a, b) => a.kilometr - b.kilometr);
      return { message: "success", data: meetings };
    }
  },
  like: async (userId, meetingId) => {
    const likeDbIf = await meetingLikes.findOne({ userId, meetingId });
    if (!likeDbIf) {
      // function getFormattedDate() {
      //   const now = new Date();

      //   // Get the timezone offset in hours and minutes
      //   const timezoneOffset = -now.getTimezoneOffset(); // Offset in minutes
      //   const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      //   const offsetMinutes = Math.abs(timezoneOffset) % 60;
      //   const sign = timezoneOffset >= 0 ? "+" : "-";

      //   // Format the date to ISO 8601-like format with timezone
      //   const formattedDate =
      //     now.getFullYear() +
      //     "-" +
      //     String(now.getMonth() + 1).padStart(2, "0") +
      //     "-" +
      //     String(now.getDate()).padStart(2, "0") +
      //     "T" +
      //     String(now.getHours()).padStart(2, "0") +
      //     ":" +
      //     String(now.getMinutes()).padStart(2, "0") +
      //     ":" +
      //     String(now.getSeconds()).padStart(2, "0") +
      //     "." +
      //     String(now.getMilliseconds()).padStart(3, "0") +
      //     sign +
      //     String(offsetHours).padStart(2, "0") +
      //     ":" +
      //     String(offsetMinutes).padStart(2, "0");

      //   return formattedDate;
      // }
      const likeDb = new meetingLikes({
        userId,
        meetingId,
        date: moment.tz(process.env.TZ).format(),
      });
      const likeDbSave = await likeDb.save();
      const meetingDb = await meetingModel.findByIdAndUpdate(
        meetingId,
        { $push: { likes: likeDb._id } },
        { new: true }
      );
      return { message: true };
    } else if (likeDbIf) {
      const meetingDb = await meetingModel.findByIdAndUpdate(
        meetingId,
        { $pull: { likes: likeDbIf._id } },
        { new: true }
      );
      const likeDb = await meetingLikes.findByIdAndDelete(likeDbIf._id);
      return { message: false };
    }
  },
  meetReject: async (meetingId, status) => {
    try {
      // const meetDb=await meetingModel.findById(meetingId)
      const meetingDb = await meetingModel.findByIdAndUpdate(
        meetingId,
        { $set: { status: 2 } },
        { new: true }
      );

      // const meetingDbMessage=await meetingModel.findByIdAndUpdate(meetingId,{$set:{statusMessage:status}},{new:true})

      const userDb = await User.findById(meetingDb.userId);
      const store = async (data) => {
        let ex_notif_type = false;
        if (data.user && data.type) {
          // const findAndLean = async (id) => {
          //   return await User.findById(id)
          //     .select(["-password", "-block", "-fcm_token"])
          //     .populate([
          //       "event_categories",
          //       "roles",
          //       "favorite_categories",
          //       "list_of_notifications",
          //       {
          //         path: "meetings",
          //         options: { sort: { createdAt: "desc" } },
          //         populate: [
          //           "images",
          //           {
          //             // path: "category",
          //             select: {
          //               name: 1,
          //               description: 1,
          //               status: 1,
          //               createdAt: 1,
          //               updaedAt: 1,
          //               avatar: 1,
          //               map_avatar: 1,
          //               categoryIcon: "$avatar",
          //             },
          //           },
          //           {
          //             path: "favorites",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "likes",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "visits",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "in_place",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //         ],
          //       },
          //       {
          //         path: "event_in_place",
          //         options: { sort: { createdAt: "desc" } },
          //         populate: [
          //           "images",
          //           {
          //             // path: "category",
          //             select: {
          //               name: 1,
          //               description: 1,
          //               status: 1,
          //               createdAt: 1,
          //               updaedAt: 1,
          //               avatar: 1,
          //               map_avatar: 1,
          //               categoryIcon: "$avatar",
          //             },
          //           },
          //           {
          //             path: "favorites",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "likes",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "visits",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //           {
          //             path: "in_place",
          //             options: { sort: { createdAt: "desc" } },
          //             select: [
          //               "name",
          //               "surname",
          //               "email",
          //               "phone_number",
          //               "avatar",
          //             ],
          //           },
          //         ],
          //       },
          //     ])
          //     .lean();
          // };
          const user = await User.findById(data.user);
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
        const notificationLists = await getNotificatationListByName(data.type);

        if (!ex_notif_type && notificationLists) {
          return 1;
        }

        let roles = await Role.find({ name: data.sent }, { _id: 1 });
        data.sent = roles;
        return await Notification.create(data);
      };

      const evLink = `alleven://eventDetail/${meetingDb._id}`;
      await store({
        status: 2,
        date_time: moment.tz(process.env.TZ).format(),
        user: userDb.id,
        type: "message",
        message: `К сожалению, ваше событие ${meetingDb.purpose} ${meetingDb.description} отклонено модератором, причина - ${status}`,
        categoryIcon: "db.images[0]",
        event: meetingDb._id,
        link: evLink,
      });

      if (userDb.notifMeeting) {
        console.log("notif send user");

        notifEvent.emit(
          "send",
          userDb._id,
          JSON.stringify({
            type: "message",
            date_time: moment.tz(process.env.TZ).format(),
            message: `К сожалению, ваше событие ${meetingDb.purpose} ${meetingDb.description} отклонено модератором, причина - ${status}`,
            link: evLink,
          })
        );
      }

      const pushInCollection = async (user_id, col_id, col_name) => {
        let user = await User.findById(user_id);
        user[col_name].push(col_id);
        user.last_event_date = moment().format("YYYY-MM-DDTHH:mm");
        await user.save();
        return 1;
      };

      await pushInCollection(userDb.id, meetingDb._id, "meetings");
      return { message: "Отклонено" };
    } catch (error) {
      console.error(error);
    }
  },
  commentLike: async (userId, commentId) => {
    const ifLike = await meetingCommentLikes.find({ userId, commentId });
    if (!ifLike.length) {
      const likeDb = new meetingCommentLikes({
        userId,
        commentId,
      });
      const like = await likeDb.save();
      const commentDb = await meetingComment.findByIdAndUpdate(
        commentId,
        { $push: { likes: like._id } },
        { new: true }
      );
      return { message: "like" };
    } else {
      const ifLike = await meetingCommentLikes.findOneAndDelete({
        userId,
        commentId,
      });
      const commentDb = await meetingComment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: ifLike._id } }, // This will remove the like._id from the likes array
        { new: true } // Returns the updated document
      );
      return { message: "unlike" };
    }
  },
  reject: async (id, data) => {
    let meeting = await meetingVerify.findById(id);
    meeting.status = 0;
    meeting.rejectMessage = data.status
    await meeting.save();
    const updatedUser = await User.findByIdAndUpdate(
      meeting.userId,
      { $set: { statusMeeting: "noVerified" } }, // Add the new meeting
      { new: true } // Return the updated document
    );
    // if (!meeting) {
    //   return 0;
    // }
    // if (data.latit && data.longit) {
    //   const pLoc = {
    //     type: "Point",
    //     coordinates: [data.latit, data.longit],
    //   };
    //   data.location = pLoc;
    // }
    const store = async (data) => {
      let ex_notif_type = false;
      if (data.user && data.notif_type) {
        const findAndLean = async (id) => {
          return await User.findById(id)
            .select(["-password", "-block", "-fcm_token"])
            .populate([
              "event_categories",
              // "roles",
              "event_favorite_categories",
              "list_of_notifications",
              // {
              //   path: "events",
              //   options: { sort: { createdAt: "desc" } },
              //   populate: [
              //     "images",
              //     {
              //       // path: "category",
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
        const getByName = async (name) => {
          return NotificatationList.findOne({ name });
        };
        return await getByName(name);
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
    const evLink = `alleven://eventDetail/${meeting._id}`;
    const msg = `К сожалению, ваше встреча отклонено модератором, причина - ${data.status}`;
    await store({
      status: 2,
      date_time: moment.tz(process.env.TZ).format(),
      user: updatedUser,
      type: "message",
      message: `К сожалению, ваше встреча отклонено модератором, причина - ${data.status}`,
      link: evLink,
      // categoryIcon: meeting.category.avatar,
      event: meeting._id,
    });
    notifEvent.emit(
      "send",
      updatedUser._id.toString(),
      JSON.stringify({
        type: "message",
        date_time: moment.tz(process.env.TZ).format(),
        message: msg,
        link: evLink,
        // categoryIcon: meeting.category.avatar,
      })
    );

    // await event.updateOne(data);
    return meeting;
  },
  // reject:async(id)=>{
  //   try {
  //     const meetingDb=await meetingModel.findById(id)
  //     const updatedUser = await User.findByIdAndUpdate(
  //       meetingDb.userId,
  //       { $set: { statusMeeting: "noVerified" } },  // Add the new meeting
  //       { new: true }  // Return the updated document
  //     );

  //     const store = async (data) => {
  //       let ex_notif_type = false;
  //       if (data.user && data.notif_type) {
  //        const findAndLean = async (id) => {
  //           return await User.findById(id).select(['-password','-block','-fcm_token']).populate(['event_categories','roles','favorite_categories','list_of_notifications',
  //           {
  //               path : 'events',
  //               options: { sort: { createdAt: 'desc'  }},
  //               populate : [
  //                   'images',
  //                   {
  //                       path: 'category',
  //                       select: {
  //                           name: 1,
  //                           description: 1,
  //                           status: 1,
  //                           createdAt: 1,
  //                           updaedAt: 1,
  //                           avatar: 1,
  //                           map_avatar: 1,
  //                           categoryIcon: '$avatar',
  //                       }
  //                   },
  //                   {
  //                   path : 'favorites',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'likes',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'visits',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'in_place',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                 ]
  //           },
  //           {
  //               path : 'event_in_place',
  //               options: { sort: { createdAt: 'desc'  }},
  //               populate : [
  //                   'images',
  //                   {
  //                       path: 'category',
  //                       select: {
  //                           name: 1,
  //                           description: 1,
  //                           status: 1,
  //                           createdAt: 1,
  //                           updaedAt: 1,
  //                           avatar: 1,
  //                           map_avatar: 1,
  //                           categoryIcon: '$avatar',
  //                       }
  //                   },
  //                   {
  //                   path : 'favorites',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'likes',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'visits',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                   {
  //                   path : 'in_place',
  //                   options: { sort: { createdAt: 'desc'  }},
  //                   select : ['name','surname','email','phone_number','avatar']
  //                   },
  //                 ]
  //           },
  //       ]).lean();
  //       }
  //         const user = await findAndLean(data.user);
  //         if (
  //           user &&
  //           user.list_of_notifications &&
  //           user.list_of_notifications.length
  //         ) {
  //           for (let l = 0; l < user.list_of_notifications.length; l++) {
  //             if (data.notif_type == user.list_of_notifications[l].name) {
  //               ex_notif_type = true;
  //               break;
  //             }
  //           }
  //         }
  //       }
  //       const getNotificatationListByName = async (name) => {
  //         return await NotificatationList.findOne({ name });
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

  //     const db = await meetingVerify
  //       .findOne({
  //         userId: updatedUser.id,
  //       })
  //       .populate("userId");

  //     const evLink = `alleven://eventDetail/${meetingDb._id}`;
  //     await store({
  //       status: 2,
  //       date_time: new Date(),
  //       user: updatedUser.id,
  //       type: "message",
  //       message: `Ваше событие ${updatedUser.id} находится на модерации`,
  //       categoryIcon: "db.images[0]",
  //       event: meetingDb._id,
  //       link: evLink,
  //     });
  //     if (updatedUser.notifMeeting) {
  //       if (updatedUser.notifMeeting) {
  //         notifEvent.emit(
  //           "send",
  //           updatedUser._id,
  //           JSON.stringify({
  //             type: "message",
  //             date_time: new Date(),
  //             message: `${updatedUser.name} ${updatedUser.surname} поздравляем модерация прошла успешно. Вы можете организовать встречу`,
  //             link: evLink,
  //           })
  //         );
  //       }
  //     }

  //     const pushInCollection = async (user_id, col_id, col_name) => {
  //       let user = await User.findById(user_id);
  //       user[col_name].push(col_id);
  //       user.last_event_date = moment().format("YYYY-MM-DDTHH:mm");
  //       await user.save();
  //       return 1;
  //     };

  //     await pushInCollection(updatedUser.id, meetingDb._id, "events");
  //     return ({message:"Верификациа отклонен"})
  //   } catch (error) {
  //     console.error(error)
  //   }
  // },
  addComment: async (userId, meetingId, comment) => {
    try {
      const meeting = await meetingModel.findById(meetingId);

      const commentDb = new meetingComment({
        userId,
        meetingId,
        text: comment,
        date: moment.tz(process.env.TZ).format(),
      });
      await commentDb.save();
      // await commentDb.populate({
      //   path: "userId", // Path to the field that contains the reference (ObjectId)
      //   select: "name surname avatar", // Select only the fields you want from the user
      // });
      const meetingUpdate = await meetingModel.findByIdAndUpdate(meetingId, {
        $push: { comments: commentDb._id },
      });
      // await meeting.save();

      return { message: "Comment added successfully", comment: commentDb };

      // else {
      //   const commentDb = new meetingComment({
      //     userId,
      //     meetingId,
      //     text: comment,
      //     date,
      //   });
      //   await commentDb.save();
      //   const meeting = await meetingModel.findById(meetingId);
      //   if (!meeting) {
      //     return { message: "Company not found", status: 404 };
      //   } else {
      //     meeting.comments.push(commentDb._id);
      //     await meeting.save();

      //     return { message: "Comment added successfully", status: 200 };
      //   }
      // }
    } catch (error) {
      console.error(error);
    }
  },
  favorit: async (userId, meetingId) => {
    try {
      const meetFavorit = await meetingFavorit.findOne({ userId, meetingId });
      if (meetFavorit) {
        await User.findByIdAndUpdate(userId, {
          $pull: { meeting_favorites: meetingId },
        })
        await meetingModel.findByIdAndUpdate(meetingId, {
          $pull: { favorites: meetFavorit._id },
        })
        await meetingFavorit.findByIdAndDelete(meetFavorit._id);
        return { message:"deleted" };
      } else{
        const meetNewFavorit = new meetingFavorit({
          userId,
          meetingId,
          date: moment.tz(process.env.TZ).format(),
        });
        await meetNewFavorit.save();

        const resultUser = await User.findById(userId);
        resultUser.meeting_favorites.push(meetingId);
        await resultUser.save();
        await meetingModel.findByIdAndUpdate(
          meetingId,
          { $push: { favorites: meetFavorit._id } },
        );
        return { message: "added" };

      }
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  near: async (id, userId) => {
    try {
      let resultChanged1;
      const resDb = await meetingModel
        .findById(id)
        .populate("comments")
        .populate("ratings");
      function calculateAverageRating(ratings) {
        if (ratings.length === 0) return 0;

        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

        const average = total / ratings.length;

        return Math.round(average * 10) / 10;
      }

      const averageRating = calculateAverageRating(resDb.ratings);

      // function getFormattedDate() {
      //   const date = new Date();

      //   const pad = (n) => n.toString().padStart(2, "0"); // Helper function to pad numbers to 2 digits

      //   const year = date.getFullYear();
      //   const month = pad(date.getMonth() + 1); // Months are zero-indexed, so we add 1
      //   const day = pad(date.getDate());
      //   const hours = pad(date.getHours());
      //   const minutes = pad(date.getMinutes());
      //   const seconds = pad(date.getSeconds());
      //   const milliseconds = date.getMilliseconds().toString().padStart(3, "0"); // Pad milliseconds to 3 digits

      //   // Timezone offset in minutes, and converting it to hours and minutes
      //   const tzOffset = date.getTimezoneOffset();
      //   const tzSign = tzOffset > 0 ? "-" : "+";
      //   const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
      //   const tzMinutes = pad(Math.abs(tzOffset) % 60);

      //   // Constructing the final string in the desired format
      //   return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${tzSign}${tzHours}:${tzMinutes}`;
      // }
      const ifView = await MeetingViews.findOne({ meetingId: id, userId });
      if (!ifView) {
        const viewDb = new MeetingViews({
          userId,
          meetingId: id,
          date: moment.tz(process.env.TZ).format(),
        });
        await viewDb.save();
        resultChanged1 = await meetingModel
          .findOneAndUpdate(
            { _id: id },
            {
              $push: { view: viewDb._id }, // Increment view count
              $set: { ratingCalculated: averageRating }, // Set new rating
            },
            { new: true } // Return the updated document
          )
          .populate("userId")
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate("participantSpot")
          .populate("view")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "userId", select: "_id name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "userId", select: "_id name surname avatar" }, // Populate userId in comments
              {
                path: "answer", // Populate the answer array
                populate: { path: "userId", select: "name surname avatar" }, // Populate userId in the nested answer array
              },
            ],
          })
          .exec();
      } else {
        resultChanged1 = await meetingModel
          .findOneAndUpdate(
            { _id: id },
            {
              // Increment view count
              $set: { ratingCalculated: averageRating }, // Set new rating
            },
            { new: true } // Return the updated document
          )
          .populate("userId")
          .populate("participants")
          .populate("likes")
          .populate("images")
          .populate("participantSpot")
          .populate("view")
          .populate("favorites")
          .populate({
            path: "ratings",
            populate: { path: "userId", select: "name surname avatar" },
          })
          .populate({
            path: "comments",
            populate: [
              { path: "userId", select: "_id name surname avatar isLike" }, // Populate userId in comments
              {
                path: "answer", // Populate the answer array
                populate: {
                  path: "userId",
                  select: "_id name surname avatar isLike",
                }, // Populate userId in the nested answer array
              },
            ],
          })
          .exec();
      }

      // for (let i = 0; i < resultChanged1.length; i++) {
      const isRating = await meetingRating.findOne({
        meetingId: resultChanged1._id,
        userId: userId,
      });

      resultChanged1.isRating = isRating ? true : false;

      const findLike = await meetingLikes.findOne({
        meetingId: resultChanged1._id,
        userId: userId,
      });

      const findParticipant = await MeetingParticipants.findOne({
        meetingId: resultChanged1._id,
        userId: userId,
      });
      if (findParticipant) {
        console.log("111111111111");

        resultChanged1.joinStatus = 2;
      }
      // const findFavorite=await meetingFavorit.findOne({

      // })
      // resultChanged1.joinStatus = findParticipant ? 2 : 1;
      const findParticipantSpot = await meetingParticipantSpot.findOne({
        meetingId: resultChanged1._id,
        userId: userId,
      });
      if (findParticipantSpot) {
        resultChanged1.joinStatus = 3;
      }
      // resultChanged1.joinStatus = findParticipantSpot ? 3 : 1;

      resultChanged1.isLike = findLike ? true : false;
      console.log("resultChanged1._id", resultChanged1._id.toString());
      console.log("userId", userId);

      const findFavorite = await meetingFavorit.findOne({
        meetingId: resultChanged1._id,
        userId: userId,
      });
      // console.log("findFavorite", findFavorite);

      resultChanged1.isFavorite = findFavorite ? true : false;
      // console.log();

      for (let i = 0; i < resultChanged1.comments.length; i++) {
        const findCommentLike = await meetingCommentLikes.findOne({
          commentId: resultChanged1.comments[i]._id,
          userId: userId,
        });
        for (let z = 0; z < resultChanged1.comments[i].answer.length; z++) {
          const findAnswerLike = await AnswerLikes.findOne({
            answerId: resultChanged1.comments[i].answer[z]._id,
            user: userId,
          });
          if (findAnswerLike) {
            resultChanged1.comments[i].answer[z].isLike = true;
          }
        }
        if (findCommentLike) {
          resultChanged1.comments[i].isLike = true;
        }
      }
      console.log("resultChanged1.comments", resultChanged1.comments[0].answer);

      // }
      return { message: "success", meeting: resultChanged1 };
    } catch (error) {
      console.error(error);
    }
  },
  addParticipant: async (userId, meetingId) => {
    try {
      const meetingDb = await meetingModel.findById(meetingId);
      // function getFormattedDate() {
      //   const now = new Date();

      //   // Get the timezone offset in hours and minutes
      //   const timezoneOffset = -now.getTimezoneOffset(); // Offset in minutes
      //   const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      //   const offsetMinutes = Math.abs(timezoneOffset) % 60;
      //   const sign = timezoneOffset >= 0 ? "+" : "-";

      //   // Format the date to ISO 8601-like format with timezone
      //   const formattedDate =
      //     now.getFullYear() +
      //     "-" +
      //     String(now.getMonth() + 1).padStart(2, "0") +
      //     "-" +
      //     String(now.getDate()).padStart(2, "0") +
      //     "T" +
      //     String(now.getHours()).padStart(2, "0") +
      //     ":" +
      //     String(now.getMinutes()).padStart(2, "0") +
      //     ":" +
      //     String(now.getSeconds()).padStart(2, "0") +
      //     "." +
      //     String(now.getMilliseconds()).padStart(3, "0") +
      //     sign +
      //     String(offsetHours).padStart(2, "0") +
      //     ":" +
      //     String(offsetMinutes).padStart(2, "0");

      //   return formattedDate;
      // }
      const dbParticipants = await MeetingParticipants.find({
        userId,
        meetingId,
      });
      console.log("dbParticipants", dbParticipants);

      if (dbParticipants.length) {
        return { message: "Уже участвуете", status: 422 };
      } else {
        const dbParticipants = new MeetingParticipants({
          userId,
          meetingId,
        });
        await dbParticipants.save();
        meetingDb.participants.push(userId);
        await meetingDb.save();
        return { message: "Ваше участие подтверждено", status: 200 };
      }
    } catch (error) {
      console.error(error);
    }
  },
  resolve: async (id) => {
    try {
      const meetVerify = await meetingVerify.findById(id);
      if (!meetVerify) {
        throw new Error("Meeting verification record not found");
      }

      meetVerify.status = 1;
      const userDb = await User.findById(meetVerify.userId); // Add await here

      if (!userDb) {
        throw new Error("User not found");
      }

      userDb.statusMeeting = true;

      await meetVerify.save();
      await userDb.save(); // This will now work correctly

      return { message: "Ваши данные проверены" };
    } catch (error) {
      console.error(error);
      throw new Error("An error occurred while verifying the data");
    }
  },
  verify: async (body, userId) => {
    try {
      const db = new MeetingVerify({
        name: body.name,
        family: body.family,
        surname: body.surname,
        passport: body.passport,
        birthday: body.term,
        passportImage: body.passportImage,
        userId,
      });

      await db.save();

      // const resDb=await MeetingVerify.find({passport:body.passport})
      // const userDb=await User.findById(userId)
      // userDb.meetings.push(db._id)
      // const user=(await userDb.save()).populate("meetings").exec()
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { statusMeeting: "inProgress" } }, // Add the new meeting
        { new: true } // Return the updated document
      );
      return { message: "success", user: updatedUser };
    } catch (error) {
      console.error(error);
    }
  },
  addMeeting: async (meeting, userId, phone) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const imagePaths = meeting.images;
    try {

      const meetingDb = new meetingModel({
        purpose: meeting.purpose,
        description: meeting.description,
        ticket: meeting.ticket,
        lon: meeting.lon,
        lan: meeting.lan,
        date: meeting.date,
        address: meeting.address,
        userId,
        phone,
        changedStatusDate: moment.tz(process.env.TZ).format(),
      });

      await meetingDb.save({ session });

      // Create and save images
      const imageDocs = imagePaths.map((path) => ({
        meetingId: meetingDb._id,
        path,
      }));

      const savedImages = await meetingImages.insertMany(imageDocs, {
        session,
      });

      // Save the references in the Meeting document
      meetingDb.images = savedImages.map((image) => image._id);
      await meetingDb.save({ session });

      await session.commitTransaction();
      session.endSession();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { meetings: meetingDb._id } }, // Add the new meeting
        { new: true } // Return the updated document
      );
      return { message: "Meeting and images saved successfully" };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      throw new Error("Failed to save meeting and images");
    }
  },
  editMeeting: async (id, updateData) => {
    try {
      // Find the event by id and update it
      const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
        new: true, // Return the updated event after the update
        runValidators: true, // Validate the update operation based on the schema
      });

      // If event not found
      // if (!updatedEvent) {
      //   return res.status(404).json({ message: "Event not found" });
      // }

      // Send the updated event as the response
      return updatedEvent;
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  },
};

export default meetingService;
