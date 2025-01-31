import UserService from "../../../services/UserService.js";
import NodeCache from "node-cache";
import GenerateRand from "../../../services/GenerateRand.js";
import SmsProstoService from "../../../services/SmsProstoService.js";
import NotificationListService from "../../../services/NotificationListService.js";
import EventService from "../../../services/EventService.js";
import AccessTokenService from "../../../services/AccessTokenService.js";
import User from "../../../models/User.js";
import jwt from "jsonwebtoken";
import meetingModel from "../../../models/meeting/meetingModel.js";
import Notification from "../../../models/Notification.js";
import companyModel from "../../../models/company/companyModel.js";
import EventCategory from "../../../models/event/EventCategory.js";
import { set } from "mongoose";
import Event from "../../../models/event/Event.js";
import EventComment from "../../../models/event/EventComment.js";
import EventCommentLikes from "../../../models/event/EventCommentLikes.js";
import EventCommentAnswer from "../../../models/event/EventCommentAnswer.js";
import EventCommentAnswerLike from "../../../models/event/EventCommentAnswerLike.js";
import EventFavorites from "../../../models/event/EventFavorites.js";
import EventViews from "../../../models/event/EventView.js";
import EventRating from "../../../models/event/EventRating.js";
import EventImpressionImages from "../../../models/event/EventImpressionImages.js";
import EventParticipantsSpot from "../../../models/event/EventParticipantsSpot.js";
import EventParticipants from "../../../models/event/EventParticipants.js";
import companyComment from "../../../models/company/companyComment.js";
import companyCommentLike from "../../../models/company/companyCommentLike.js";
import companyCommentAnswer from "../../../models/company/companyCommentAnswer.js";
import companyCommentAnswerLike from "../../../models/company/companyCommentAnswerLike.js";
import companyImage from "../../../models/company/companyImage.js";
import companyLikes from "../../../models/company/companyLikes.js";
import companyFavorit from "../../../models/company/companyFavorit.js";
import companyView from "../../../models/company/companyView.js";
import companyRating from "../../../models/company/companyRating.js";
import companyPhones from "../../../models/company/companyPhones.js";
import CompanyServiceModel from "../../../models/company/companyService.js";
import companyImpressionImages from "../../../models/company/companyImpressionImages.js";
import companyHotDeals from "../../../models/company/companyHotDeals.js";
import meetingComment from "../../../models/meeting/meetingComment.js";
import meetingCommentLikes from "../../../models/meeting/meetingCommentLikes.js";
import meetingCommentAnswer from "../../../models/meeting/meetingCommentAnswer.js";
import MeetingAnswerLikes from "../../../models/meeting/meetingCommentAnswerLike.js";
import meetingImages from "../../../models/meeting/meetingImages.js";
import meetingLikes from "../../../models/meeting/meetingLikes.js";
import meetingFavorit from "../../../models/meeting/meetingFavorit.js";
import meetingParticipantSpot from "../../../models/meeting/meetingParticipantSpot.js";
import meetingView from "../../../models/meeting/meetingView.js";
import meetingRating from "../../../models/meeting/meetingRating.js";
import meetingParticipant from "../../../models/meeting/meetingParticipant.js";
import MeetingImpressionImage from "../../../models/meeting/meetingImpressionImage.js";
import meetingVerify from "../../../models/meeting/meetingVerify.js";
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

class ProfileController {
  constructor() {
    this.UserService = new UserService();
    this.SmsProstoService = new SmsProstoService();
    this.GenerateRand = new GenerateRand();
    this.NotificationListService = new NotificationListService();
    this.EventService = new EventService();
    this.AccessTokenService = new AccessTokenService();
  }

  index = async (req, res) => {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];

    const user = jwt.decode(token);

    let u = await User.findById(user.id)
      .populate("roles")
      .populate({ path: "company", select: "_id services companyName" });
    if (u) {
      u.unread_notifications = await this.UserService.getCountNotif(user.id)

      return res.status(200).send({ success: true, data: u });
    } else {
      return res
        .status(403)
        .send({ success: false, message: "User not found" });
    }
    const user1 = await this.UserService.findAndLean(user.id);

  };

  update = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token1 = authHeader.split(" ")[1];
    const user1 = jwt.decode(token1);

    const user = await this.UserService.update(user1.id, req.body);
    const token = await this.AccessTokenService.jwtSignByPhone(
      user.phone_number
    );
    return res.json({
      status: "success",
      message: "Updated successfully",
      user,
      token,
    });
  };

  updateAvatar = async (req, res) => {
    let user = await this.UserService.updateAvatar(
      req.user.id,
      req.files.avatar
    );
    const token = await this.AccessTokenService.jwtSignByPhone(
      user.phone_number
    );
    return res.json({ status: "success", data: user, token });
  };

  destroy = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token1 = authHeader.split(" ")[1];
    const user1 = jwt.decode(token1);
    const eventsDb = await Event.find({ owner: user1.id });
    const companiesDb = await companyModel.findOne({ owner: user1.id });
    const meetingsDb = await meetingModel.find({ user: user1.id });

    setTimeout(async () => {


      if (eventsDb.length) {
        for (let i = 0; i < eventsDb.length; i++) {
          const event = await Event.findById(eventsDb[i]._id);

          if (!event) {
            throw new Error("Event not found");
          }

          const comments = await EventComment.find({
            event: eventsDb[i]._id,
          });

          for (const comment of comments) {
            await EventCommentLikes.deleteMany({ commentId: comment._id });

            const answers = await EventCommentAnswer.find({
              commentId: comment._id,
            });

            for (const answer of answers) {
              await EventCommentAnswerLike.deleteMany({ answerId: answer._id });
            }

            await EventCommentAnswer.deleteMany({ commentId: comment._id });
          }

          await EventComment.deleteMany({ event: eventsDb[i]._id });
          await EventCommentLikes.deleteMany({ eventId: eventsDb[i]._id });
          await EventFavorites.deleteMany({ eventId: eventsDb[i]._id });
          await EventViews.deleteMany({ eventId: eventsDb[i]._id });
          await EventRating.deleteMany({ event: eventsDb[i]._id });
          await EventImpressionImages.deleteMany({ event: eventsDb[i]._id });
          await EventParticipantsSpot.deleteMany({ eventId: eventsDb[i]._id });
          await EventParticipants.deleteMany({ eventId: eventsDb[i]._id });
          await event.remove();
          console.log("Event and all related data deleted successfully");
        }
        await EventCategory.deleteMany({ owner: user1.id });
      }

      if (companiesDb) {
        const company = await companyModel.findById(companiesDb._id);

        if (!company) {
          throw new Error("Event not found");
        }

        const comments = await companyComment.find({
          companyId: companiesDb._id,
        });

        for (const comment of comments) {
          await companyCommentLike.deleteMany({ commentId: comment._id });

          const answers = await companyCommentAnswer.find({
            commentId: comment._id,
          });

          for (const answer of answers) {
            await companyCommentAnswerLike.deleteMany({ answerId: answer._id });
          }

          await companyCommentAnswer.deleteMany({ commentId: comment._id });
        }

        await companyComment.deleteMany({ companyId: companiesDb._id });
        await companyImage.deleteMany({ companyId: companiesDb._id });
        await companyLikes.deleteMany({ companyId: companiesDb._id });
        await companyFavorit.deleteMany({ companyId: companiesDb._id });
        await companyView.deleteMany({ companyId: companiesDb._id });
        await companyRating.deleteMany({ companyId: companiesDb._id });
        await companyPhones.deleteMany({ companyId: companiesDb._id });
        await CompanyServiceModel.deleteMany({ companyId: companiesDb._id });
        await companyImpressionImages.deleteMany({
          companyId: companiesDb._id,
        });
        await companyHotDeals.deleteMany({ companyId: companiesDb._id });
        await company.remove();
        console.log("Company and all related data deleted successfully");
      }
      //company deleteMany

      //meeting deleteMany
      ///////////////////////////////////////////////////////////////////////////////
      if (meetingsDb.length) {
        for (let i = 0; i < meetingsDb.length; i++) {
          const meeting = await meetingModel.findById(meetingsDb[i]._id);

          if (!meeting) {
            throw new Error("Meeting not found");
          }

          const comments = await meetingComment.find({
            meetingId: meetingsDb[i]._id,
          });

          for (const comment of comments) {
            await meetingCommentLikes.deleteMany({ commentId: comment._id });

            const answers = await meetingCommentAnswer.find({
              commentId: comment._id,
            });

            for (const answer of answers) {
              await MeetingAnswerLikes.deleteMany({ answerId: answer._id });
            }

            await meetingCommentAnswer.deleteMany({ commentId: comment._id });
          }

          await meetingComment.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingImages.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingLikes.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingFavorit.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingParticipantSpot.deleteMany({
            meetingId: meetingsDb[i]._id,
          });
          await meetingView.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingRating.deleteMany({ meetingId: meetingsDb[i]._id });
          await meetingParticipant.deleteMany({ meetingId: meetingsDb[i]._id });
          await MeetingImpressionImage.deleteMany({
            meetingId: meetingsDb[i]._id,
          });
          await meetingVerify.deleteMany({ user: user1.id });
          await meeting.remove();
          console.log("Meetings and all related data deleted successfully");
        }
      }
      ///////////////////////////////////////////////////////////////////////////////
      //meeting deleteMany
    }, 1000);
    await this.UserService.destroy(user1.id);

    return res.json({ status: "success", message: "User succesfuly deleted" });
  };

  updatePhoneNumber = async (req, res) => {
    const { phone_number } = req.body;
    const exUser = await this.UserService.findByPhoneNumber(phone_number);
    if (exUser) {
      res.status(400);
      return res.json({
        satatus: false,
        message: "Номер телефона уже используется",
      });
    }
    const rand = await this.GenerateRand.pin();
    const sms = await this.SmsProstoService.sendMessage(phone_number, rand);
    if (sms != "0") {
      res.status(400);
      return res.json({
        satatus: false,
        message: "Неверный формат номер телефона",
      });
    }
    myCache.set(
      `update_phone_number_${req.user.id}`,
      `${rand}_${phone_number}`,
      54000
    );
    return res.json({
      satatus: "success",
      message: "Проверьте свой телефон, через 15 минут код исчезнет",
    });
  };

  updatePhoneNumberConfirm = async (req, res) => {
    const { phone_number_code } = req.body;

    const ph_num_c = myCache.get(`update_phone_number_${req.user.id}`);
    if (!ph_num_c) {
      return res.json({
        status: "fail",
        message: "15-минутный лимит исчерпан, попробуйте еще раз",
      });
    }
    const data = ph_num_c.split("_");

    if (data[0] != phone_number_code) {
      return res.json({ status: "fail", message: "Неверный код" });
    }

    const nUser = await this.UserService.update(req.user.id, {
      phone_number: data[1],
    });
    const token = await this.AccessTokenService.jwtSignByPhone(
      nUser.phone_number
    );

    return res.json({
      status: "success",
      message: "Номер телефона успешно обновлен",
      token,
    });
  };

  storeFavoriteCategory = async (req, res) => {
    const category = req.body.event_category_id;
    const data = await this.UserService.pushInCollection(
      req.user.id,
      category,
      "event_favorite_categories"
    );
    return res.json({ message: "success" });
  };

  destroyFavoriteCategory = async (req, res) => {
    const category = req.body.event_category_id;
    const data = await this.UserService.destroyFromCollection(
      req.user.id,
      category,
      "event_favorite_categories"
    );
    return res.json({ message: "success" });
  };

  getFavoriteCategory = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader !== "null") {
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const data = await this.UserService.getSpecCol(
        user.id,
        "event_favorite_categories"
      );
      if (data) {
        return res
          .status(200)
          .json({ message: "success", data: data.event_favorite_categories });
      } else {
        return res.status(403).json({ message: "success", data: [] });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  };

  getNotification = async (req, res) => {
    // const data = await this.NotificationListService.get();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader !== "null") {
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const data = await this.NotificationListService.getByRole(user.role);

      const userNotificationList = await this.UserService.getSpecCol(
        user.id,
        "list_of_notifications"
      );
      if (userNotificationList) {
        for (let d = 0; d < data.length; d++) {
          for (
            let c = 0;
            c < userNotificationList.list_of_notifications.length;
            c++
          ) {
            if (
              data[d]._id ==
              userNotificationList.list_of_notifications[c]._id.toString()
            ) {
              data[d].confirmed = true;
            }
          }
          if (!userNotificationList.list_of_notifications.length) {
            data[d].confirmed = false;
          }
        }

        return res.status(200).send({ success: true, data });
      } else {
        return res.status(403).send({ success: true, data: [] });
      }
    } else {
      return res.status(403).send({ message: "Unauthorized" });
    }
  };

  storeNotification = async (req, res) => {
    const notification = req.body.notifications_list_id;
    const data = await this.UserService.pushInCollection(
      req.user.id,
      notification,
      "list_of_notifications"
    );
    return res.json({ message: "success" });
  };

  destroyNotification = async (req, res) => {
    const notification = req.body.notifications_list_id;
    const data = await this.UserService.destroyFromCollection(
      req.user.id,
      notification,
      "list_of_notifications"
    );
    return res.json({ message: "success" });
  };

  userEdit = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const { name, path } = req.body;
      const result = await User.findById(user.id);
      if (path && name && path !== "null" && name !== "null") {
        const names = name.split(" ");
        result.name = names[0];
        result.surname = names[1];
        result.avatar = path;
        await result.save();
        return res.status(200).send({ message: "success" });
      } else {
        if (name && name !== "null") {
          const names = name.split(" ");
          result.name = names[0];
          result.surname = names[1];
          await result.save();
          return res.status(200).send({ message: "success" });
        } else if (path && path !== "null") {
          result.avatar = path;
          await result.save();
          return res.status(200).send({ message: "success" });
        } else {
          return res.status(400).send({ message: "wrong data" });
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(400).send({ message: "wrong data" });
    }
  };
}

export default new ProfileController();
