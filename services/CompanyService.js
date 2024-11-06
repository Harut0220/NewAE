import notifEvent from "../events/NotificationEvent.js";
import companyCategory from "../models/company/companyCategory.js";
import Company from "../models/company/companyModel.js";
import CompanyServiceModel from "../models/company/companyService.js";
import Notification from "../models/Notification.js";
import NotificatationList from "../models/NotificationList.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import NotificatationListService from "./NotificationListService.js";
import moment from "moment";

// import UserService from "./UserService.js";
import companyImage from "../models/company/companyImage.js";
import mongoose from "mongoose";
import companyPhones from "../models/company/companyPhones.js";
import CompanyComment from "../models/company/companyComment.js";
import CompanyLikes from "../models/company/companyLikes.js";
import companyFavorit from "../models/company/companyFavorit.js";
import companyRating from "../models/company/companyRating.js";
import CompanyCommentLikes from "../models/company/companyCommentLike.js";
import companyComment from "../models/company/companyComment.js";
import companyCommentAnswer from "../models/company/companyCommentAnswer.js";
import CommentAnswerLikes from "../models/company/companyCommentAnswerLike.js";
import UserService from "./UserService.js";
const companyService = {
  commentDelete: async (id) => {
    try {
      const commentDb = await companyComment.findById(id);
    await commentDb.remove();
    const commentAnswerDb = await companyCommentAnswer.find({ commentId: id });
    await commentAnswerDb.remove();
    const commentLikesDb = await CompanyCommentLikes.find({ commentId: id });
    await commentLikesDb.remove();
    const commentAnswerLikesDb = await CommentAnswerLikes.find({
      answerId: commentAnswerDb[0]._id,
    });
    await commentAnswerLikesDb.remove();
    const meetingDb = await Company.findByIdAndUpdate(
      commentDb.companyId,
      { $pull: { comments: commentDb._id } }
    );
      return ({
        success: true,
        message: "Successfully deleted",});
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  commentAnswerDelete: async (id) => {
    try {
      await CommentAnswerLikes.deleteMany({ answerId: id });
      await companyCommentAnswer.findByIdAndDelete(id);
      await companyComment.findByIdAndUpdate(
        id,
        { $pull: { answers: id } }
      )
      return ({
        success: true,
        message: "Successfully deleted",});
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  onlinePage: async () => {
    try {
      const companies = await Company.find({status: 1, onlinePay: true });
      return companies;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  online: async (userId, companyId) => {
    try {
      const company = await Company.findById(companyId);
      const store = async (data) => {
        console.log(data, "data1");

        let ex_notif_type = true;
        if (data.user && data.notif_type) {
          console.log(data, "data2");
          const user = await UserService.findAndLeanCompany(data.user);
          console.log(data, "data3");
          if (
            user &&
            user.list_of_notifications &&
            user.list_of_notifications.length
          ) {
            console.log(data, "data4");
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

      const evLink = `alleven://eventDetail/${company._id}`;
      await store({
        status: 2,
        date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
        user: userId,
        type: "Онлайн оплата",
        message: `Ваше событие ${company.companyName} находится на модерации`,
        categoryIcon: "db.images[0]",
        event: company._id,
        link: evLink,
      });
      const categor = await companyCategory.find({ _id: company.category });
      // notifEvent.emit(
      //   "send",
      //   company.owner.toString(),
      //   JSON.stringify({
      //     type: "Новая услуга",
      //     date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
      //     message: `Ваше событие ${company.companyName} находится на модерации`,
      //     categoryIcon: categor.image,
      //     link: evLink,
      //   })
      // );
      const pushInCollection = async (user_id, col_id, col_name) => {
        let user = await User.findById(user_id);
        user[col_name].push(col_id);
        user.last_event_date = moment
          .tz(process.env.TZ)
          .format("YYYY-MM-DDTHH:mm");
        await user.save();
        return 1;
      };

      await pushInCollection(userId, company._id, "events");


      notifEvent.emit(
        "send",
        "ADMIN",
        JSON.stringify({
          type: "Онлайн оплата",
          message: "event",
          data: company,
        })
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  commentAnswerLike: async (answerId, userId) => {
    try {
      const isLike = await CommentAnswerLikes.findOne({
        user: userId,
        answerId,
      });
      if (isLike) {
        await companyCommentAnswer.findByIdAndUpdate(answerId, {
          $pull: { likes: isLike._id },
        });
        await CompanyCommentLikes.findByIdAndDelete(isLike._id);
        return { message: "unlike" };
      } else {
        const commentAnswerLike = new CommentAnswerLikes({
          user: userId,
          answerId,
        });
        await commentLike.save();
        await companyCommentAnswer.findByIdAndUpdate(commentId, {
          $push: { likes: commentAnswerLike._id },
        });
        return { message: "like" };
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  commentAnswer: async (commentId, userId, text) => {
    try {
      const comment = await CompanyComment.findById(commentId);
      const commentAnswer = new companyCommentAnswer({
        commentId,
        userId,
        text,
        companyId: comment.companyId,
        date: moment.tz(process.env.TZ).format(),
      });
      await commentAnswer.save();
      comment.answer.push(commentAnswer._id);
      await comment.save();
      return { message: "success", answer: commentAnswer };
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  commentLike: async (commentId, userId) => {
    try {
      const isLike = await CompanyCommentLikes.findOne({ userId, commentId });
      if (isLike) {
        await companyComment.findByIdAndUpdate(commentId, {
          $pull: { likes: isLike._id },
        });
        await CompanyCommentLikes.findByIdAndDelete(isLike._id);
        return { message: "unlike" };
      } else {
        const commentLike = new CompanyCommentLikes({ userId, commentId });
        await commentLike.save();
        await companyComment.findByIdAndUpdate(commentId, {
          $push: { likes: commentLike._id },
        });
        return { message: "like" };
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  rating: async (eventId, userId, rating) => {
    try {
      const rating = new companyRating({ eventId, userId, rating });
      await rating.save();
      await Company.findByIdAndUpdate(eventId, {
        $push: { rating: rating._id },
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  onlineReject: async (id,status) => {
    try {
      const companyDb = await Company.findById(id)
        .populate("owner")
        .populate("category")
        .populate("images")
        .populate("services")
        .populate("phoneNumbers");
      companyDb.onlinePay = false;
      companyDb.onlineReason = status;
      await companyDb.save();
      const userDb = await User.find(companyDb.owner);
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
                // path: "companys",
                // options: { sort: { createdAt: "desc" } },
                // populate: [
                //   "images",
                //   // {
                //   //   path: "category",
                //   //   select: {
                //   //     name: 1,
                //   //     description: 1,
                //   //     status: 1,
                //   //     createdAt: 1,
                //   //     updaedAt: 1,
                //   //     avatar: 1,
                //   //     map_avatar: 1,
                //   //     categoryIcon: "$avatar",
                //   //   },
                //   // },
                //   // {
                //   //   path: "favorites",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "likes",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "visits",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "in_place",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                // ],
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
                //     // {
                //     //   path: "favorites",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "likes",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "visits",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "in_place",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
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
        const notificationLists = await getNotificatationListByName(data.type);

        if (!ex_notif_type && notificationLists) {
          return 1;
        }

        let roles = await Role.find({ name: data.sent }, { _id: 1 });
        data.sent = roles;
        return await Notification.create(data);
      };

      const evLink = `alleven://eventDetail/${companyDb._id}`;
      await store({
        status: 2,
        date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        user: userDb.id,
        type: "Новая услуга",
        message: `К сожалению, ваше событие ${companyDb.companyName} отклонено модератором, причина - ${status}`,
        categoryIcon: "db.images[0]",
        event: companyDb._id,
        link: evLink,
      });

      if (userDb.notifCompany) {
        console.log("notif send user");

        notifEvent.emit(
          "send",
          userDb._id.toString(),
          JSON.stringify({
            type: "Новая услуга",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
            message: `К сожалению, ваше событие ${companyDb.companyName} отклонено модератором, причина - ${status}`,
            link: evLink,
          })
        );
      }

      // const pushInCollection = async (user_id, col_id, col_name) => {
      //   let user = await User.findById(user_id);
      //   user[col_name].push(col_id);
      //   user.last_event_date = moment().format("YYYY-MM-DDTHH:mm");
      //   await user.save();
      //   return 1;
      // };

      // await pushInCollection(userDb.id, companyDb._id, "services");
      // console.log(companyDb,"companyDb");
      
      return companyDb;
    } catch (error) {
      console.error(error);
    }
  },
  reject: async (id, status) => {
    try {
      const companyDb = await Company.findById(id)
        .populate("owner")
        .populate("category")
        .populate("images")
        .populate("services")
        .populate("phoneNumbers");
      companyDb.status = 2;
      companyDb.rejectMessage = status;
      await companyDb.save();
      const userDb = await User.find(companyDb.owner);
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
                // path: "companys",
                // options: { sort: { createdAt: "desc" } },
                // populate: [
                //   "images",
                //   // {
                //   //   path: "category",
                //   //   select: {
                //   //     name: 1,
                //   //     description: 1,
                //   //     status: 1,
                //   //     createdAt: 1,
                //   //     updaedAt: 1,
                //   //     avatar: 1,
                //   //     map_avatar: 1,
                //   //     categoryIcon: "$avatar",
                //   //   },
                //   // },
                //   // {
                //   //   path: "favorites",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "likes",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "visits",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                //   // {
                //   //   path: "in_place",
                //   //   options: { sort: { createdAt: "desc" } },
                //   //   select: [
                //   //     "name",
                //   //     "surname",
                //   //     "email",
                //   //     "phone_number",
                //   //     "avatar",
                //   //   ],
                //   // },
                // ],
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
                //     // {
                //     //   path: "favorites",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "likes",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "visits",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
                //     // {
                //     //   path: "in_place",
                //     //   options: { sort: { createdAt: "desc" } },
                //     //   select: [
                //     //     "name",
                //     //     "surname",
                //     //     "email",
                //     //     "phone_number",
                //     //     "avatar",
                //     //   ],
                //     // },
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
        const notificationLists = await getNotificatationListByName(data.type);

        if (!ex_notif_type && notificationLists) {
          return 1;
        }

        let roles = await Role.find({ name: data.sent }, { _id: 1 });
        data.sent = roles;
        return await Notification.create(data);
      };

      const evLink = `alleven://eventDetail/${companyDb._id}`;
      await store({
        status: 2,
        date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        user: userDb.id,
        type: "Новая услуга",
        message: `К сожалению, ваше событие ${companyDb.companyName} отклонено модератором, причина - ${status}`,
        categoryIcon: "db.images[0]",
        event: companyDb._id,
        link: evLink,
      });

      if (userDb.notifCompany) {
        console.log("notif send user");

        notifEvent.emit(
          "send",
          userDb._id.toString(),
          JSON.stringify({
            type: "Новая услуга",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
            message: `К сожалению, ваше событие ${companyDb.companyName} отклонено модератором, причина - ${status}`,
            link: evLink,
          })
        );
      }

      // const pushInCollection = async (user_id, col_id, col_name) => {
      //   let user = await User.findById(user_id);
      //   user[col_name].push(col_id);
      //   user.last_event_date = moment().format("YYYY-MM-DDTHH:mm");
      //   await user.save();
      //   return 1;
      // };

      // await pushInCollection(userDb.id, companyDb._id, "services");
      return companyDb;
    } catch (error) {
      console.error(error);
    }
  },
  onlineResolve: async (id) => {
    const company = await Company.findById(id);
    company.onlinePay = true;
    await company.save();
    return { message: "заявка одобрена" };
  },
  resolve: async (id) => {
    const company = await Company.findById(id);
    company.status = 1;
    await company.save();
    return { message: "заявка одобрена" };
  },
  addCompany: async (data, userId) => {
    try {
      console.log(data, userId,"data, userId");

      data.userId = userId;
      const longit = data.coords.longit;
      const latit = data.coords.latit;
      const companyName = data.name;
      const DB = await Company.findOne({ longit, latit, companyName});
      const categoryIf = await companyCategory.findById(data.category);
      async function addCompanyData(data) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const company = new Company({
            category: mongoose.Types.ObjectId(data.category),
            companyName: companyName,
            web: data.web,
            coords: data.coords,
            place_name: data.place_name,
            email: data.email,
            startHour: data.startHour,
            endHour: data.endHour,
            days: data.days,
            // rating: data.rating,
            // kilometr: data.kilometr,
            // status: data.status,
            owner: userId,
          });
          await company.save({ session });

          const imagePromises = data.images.map(async (url) => {
            const image = new companyImage({
              url,
              companyId: company._id,
            });
            return image.save({ session });
          });
          await User.findByIdAndUpdate(userId, {
            $push: { companies: company._id },
          });
          const images = await Promise.all(imagePromises);

          const phonePromises = data.phoneNumbers.map(async (phoneData) => {
            const phone = new companyPhones({
              number: phoneData.value,
              whatsApp: phoneData.whatsUp,
              telegram: phoneData.telegram,
              companyId: company._id,
            });
            return phone.save({ session });
          });
          const phoneNumbers = await Promise.all(phonePromises);

          const servicePromises = data.services.map(async (serviceData) => {
            const service = new CompanyServiceModel({
              type: serviceData.type,
              description: serviceData.description,
              cost: serviceData.cost,
              images: serviceData.images,
              companyId: company._id,
            });



            return service.save({ session });
          });
          const services = await Promise.all(servicePromises);



          company.images = images.map((image) => image._id);
          company.phoneNumbers = phoneNumbers.map((phone) => phone._id);
          company.services = services.map((service) => service._id);
          // company.comments = comments.map((comment) => comment._id);
          // company.likes = likes.map((like) => like._id);

          await company.save({ session });

          // Commit transaction
          await session.commitTransaction();
          session.endSession();

          console.log("Company and related data added successfully!");
          return company;
        } catch (error) {
          console.error("Error adding company data:", error);
          if (session) {
            await session.abortTransaction();
            session.endSession();
          }
          throw error;
        }
      }

      if (!DB && categoryIf) {
        const resultBaza = await addCompanyData(data);



        return { message: "company added", company: resultBaza };
      }

      return { message: "company exist" };
    } catch (error) {
      console.error(error);
    }
  },
  addFavorites: async (userId, companyId) => {
    try {
      const resFav = await companyFavorit.findOne({ userId, companyId });
      if (!resFav) {
        const newFav = new companyFavorit({
          userId,
          companyId,
        });
        await newFav.save();
        await Company.findByIdAndUpdate(companyId, {
          $push: { favorites: userId },
        });
        await User.findByIdAndUpdate(userId, {
          $push: { company_favorites: companyId },
        });
        return { message: "успешно добавлен в список избранных" };
      } else {
        await User.findByIdAndUpdate(userId, {
          $pull: { company_favorites: companyId },
        });
        await Company.findByIdAndUpdate(companyId, {
          $pull: { favorites: resFav._id },
        });
        await companyFavorit.findByIdAndDelete(resFav._id);
        return { message: "матч успешно удален из списка избранных" };
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  // editeCompany: async () => {
  //   try {
  //     return { message: "company update" };
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  addService: async (companyId, service) => {
    try {
      const company = await Company.findOne({ _id: companyId });
      // const imageArray = [];
      // for (let z = 0; i < service.length; z++) {
      //   imageArray.push(service[z].image);
      // }

      const serviceDb = new CompanyServiceModel({
        type: service.type,
        companyId: companyId,
        description: service.description,
        cost: service.cost,
        images: service.images,
      });
      await serviceDb.save();

      company.services.push(serviceDb._id);
      await company.save();

      // await companyServiceMod.save()

      return { message: "service added" };
    } catch (error) {
      console.error(error);
    }
  },
  // getOne: async (companyId) => {
  //   try {
  //     const Db = await Company.find({ _id: companyId });

  //     return { message: "success", company: Db };
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  getMy: async (userId) => {
    try {
      const companies = await Company.find({ owner: userId });
      const myLatitude = 55.7558;
      const myLongitude = 37.6176;
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
      companies.forEach((company) => {
        company.kilometr = calculateDistance(
          myLatitude,
          myLongitude,
          company.coords.latit,
          company.coords.longit
        );
      });

      companies.sort((a, b) => a.kilometr - b.kilometr);

      let pastLikes;
      let pastComment;
      let view;
      let favorites;
      let pastParticipants;
      let countAll = 0;
      for (let i = 0; i < companies.length; i++) {
        pastLikes = companies[i].likes.filter((like) => {
          const parsedGivenDate = moment(like.date);



          return parsedGivenDate.isAfter(companies[i].changedStatusDate);
        });

        pastComment = companies[i].comments.filter((like) => {
          const parsedGivenDate = moment(like.date);

          return parsedGivenDate.isAfter(companies[i].changedStatusDate);
        });

        view = resDb[i].view.filter((like) => {
          const parsedGivenDate = moment(like.date);

          return parsedGivenDate.isAfter(companies[i].changedStatusDate);
        });

        favorites = companies[i].favorites.filter((like) => {
          const parsedGivenDate = moment(like.date);

          return parsedGivenDate.isAfter(companies[i].changedStatusDate);
        });

        pastParticipants = companies[i].participants.filter((like) => {
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
          companies[i].changes.favorites = true;
        }
        if (pastLikes.length) {
          companies[i].changes.like = true;
        }
        if (pastComment.length) {
          companies[i].changes.comment = true;
        }
        if (pastParticipants.length) {
          companies[i].changes.participant = true;
        }
        if (view.length) {
          companies[i].changes.view = true;
        }
        if (count) {
          companies[i].changes.count = count;
        }
        await resDb[i].save();
      }
      const dateChange=await Company.find({ owner: userId });
       setTimeout(async () => {
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
      })

      return companies;
    } catch (error) {
      console.error(error);
    }
  },
};

export default companyService;
