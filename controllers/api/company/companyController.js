import companyCategory from "../../../models/company/companyCategory.js";
import calendar from "../../../public/calendar/calendar.js";
import categoryArray from "../../../public/categoryCompany.js";
import companyService from "../../../services/CompanyService.js";
// import companyServiceDb from "../../../models/company/companyService.js";
import EventCategoryService from "../../../services/EventCategoryService.js";
import EventService from "../../../services/EventService.js";
import Company from "../../../models/company/companyModel.js";
import notifEvent from "../../../events/NotificationEvent.js";
import companyServiceDb from "../../../models/company/companyService.js";
import Event from "../../../models/event/Event.js";
import NotificationService from "../../../services/NotificationService.js";
import UserService from "../../../services/UserService.js";
import Role from "../../../models/Role.js";
import NotificatationListService from "../../../services/NotificationListService.js";
import NotificatationList from "../../../models/NotificationList.js";
import Notification from "../../../models/Notification.js";
import User from "../../../models/User.js";
import moment from "moment";
import jwt from "jsonwebtoken";
import companyLikes from "../../../models/company/companyLikes.js";
import companyComment from "../../../models/company/companyComment.js";
import CompanyFavorites from "../../../models/company/companyFavorit.js";
import companyModel from "../../../models/company/companyModel.js";
// import companyView from "../../../models/company/companyView.js";
import companyFavorit from "../../../models/company/companyFavorit.js";
import companyRating from "../../../models/company/companyRating.js";
import servicesRegistrations from "../../../models/services/servicesRegistrations.js";
import companyView from "../../../models/company/companyView.js";

const companyController = {
  commentDelete: async (req, res) => {
    try {
      const {id} = req.body;
      const result = await companyService.commentDelete(id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});
    }
  },
  commentAnswerDelete: async (req, res) => {
    try {
      const {id} = req.body;
      const result = await companyService.commentAnswerDelete(id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  OnlineReject: async (req, res) => {
    try {
      const id = req.params.id;
      let status = req.body.status;
      const event = await companyService.onlineReject(id, status);
      let template = "profile/companyPay-single-rejected";
      console.log(event, "event.onlineReason");
      let participants = 0;
      event.services.forEach((el) => {
        participants = participants + el.serviceRegister.length;
      });
      res.render(template, {
        layout: "profile",
        title: "Company Show",
        user: req.user,
        userOwner: event.owner,
        event: event,
        services: event.services,
        images: event.images,
        phone_numbers: event.phoneNumbers,
        eventCat: event.category.name,
        onlineReason: event.onlineReason,
        favorites: event.favorites.length,
        views: event.view.length,
        likes: event.likes.length,
        participants,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  OnlineResolve: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await companyService.onlineResolve(id);
      let template = "profile/companyPay-single";
      const dbCompany = await Company.findById(id)
        .populate("images")
        .populate("services")
        .populate("phoneNumbers")
        .populate("owner");
      const user = await User.findById(dbCompany.owner);
      const eventCat = await companyCategory.findById(dbCompany.category);
      res.render(template, {
        layout: "profile",
        title: "Company Show",
        user: req.user,
        userOwner: dbCompany.owner,
        event: dbCompany,
        services: dbCompany.services,
        images: dbCompany.images,
        phone_numbers: dbCompany.phoneNumbers,
        eventCat,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  OnlineSingleCompany: async (req, res) => {
    try {
      let template = "profile/companyPay-single";
      let event = await companyModel
        .findById(req.params.id)
        .populate("images")
        .populate("services")
        .populate("phoneNumbers");
      const services = await companyServiceDb.find({ companyId: event._id });
      let registr = 0;
      for (let i = 0; i < services.length; i++) {
        const serviceRegistr = await servicesRegistrations.find({
          serviceId: services[i]._id,
        });
        registr = registr + serviceRegistr.length;
      }
      let eventCat = await companyCategory.findById(event.category);
      const user = await User.findById(event.owner);
      const favorite = await companyFavorit.find({ companyId: req.params.id });
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }

      console.log("33333");


      res.render(template, {
        layout: "profile",
        title: "Company Single",
        user: req.user,
        userOwner: user,
        event,
        eventCat,
        services: event.services,
        images: event.images,
        phone_numbers: event.phoneNumbers,
        favorite: favorite.length,
        likes: event.likes.length,
        registr,
        statusMessage: event.rejectMessage,
        onlineReason: event.onlineReason,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  // singlePay: async (req, res) => {
  //   try {
  //     let template = "profile/company-single-pay";
  //     let event = await companyModel.findById(req.params.id).populate("images").populate("services").populate("phoneNumbers");
  //     const services=await companyServiceDb.find({companyId:event._id})
  //     let registr=0;
  //     for(let i=0;i<services.length;i++){
  //       const serviceRegistr=await servicesRegistrations.find({serviceId:services[i]._id})
  //       registr=registr+serviceRegistr.length
  //     }
  //     let eventCat = await companyCategory.findById(event.category);
  //     const user=await User.findById(event.owner)
  //     const favorite=await companyFavorit.find({companyId:req.params.id})
  //     // let eventCats= await companyCategory.find()
  //     if (event.status && event.status != 0 && event.status != 1) {
  //       template += "-rejected";
  //     }

  //    console.log("33333");

  //     // console.log(userOwner,"userOwner");

  //     res.render(template, {
  //       layout: "profile",
  //       title: "Company Single",
  //       user:req.user,
  //       userOwner:user,
  //       event,
  //       eventCat,
  //       // eventCats,
  //       services:event.services,
  //       images:event.images,
  //       phone_numbers:event.phoneNumbers,
  //       favorite:favorite.length,
  //       likes:event.likes.length,
  //       registr,
  //       statusMessage:event.rejectMessage
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // },
  onlinePage: async (req, res) => {
    try {
      const { name, category, date_from } = req.query;
      let params = {};
      let events;
      if (name) {
        params.name = name;
        events = await Company.find({ companyName: name })
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }

      if (category) {
        const eventCats = await companyCategory.findById(category);
        params.category = category;
        events = await Company.find({ category: eventCats._id })
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }

      if (!category && !name) {
        events = await Company.find()
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }

      // if (date_from) {
      //   params.started_time = {
      //     $gte: new Date(date_from).toISOString(),
      //   };
      // }

      const eventCats = await companyCategory.find();


      console.log("eventCats", eventCats);
      res.render("profile/companyPay", {
        layout: "profile",
        title: "Company",
        user: req.user,
        events,
        eventCats,
        q: req.query,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  online: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      // const user = { id: "67179274c97711b40767ef1b" };
      const { id } = req.body;
      const result = await companyService.online(user.id, id);
      if (result) {
        res.status(200).send(result);
      } else {
        res.status(401).send({
          message: "error",
        });
      }
 
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  commentAnswerLike: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const { id } = req.body;
        const result = await companyService.commentAnswerLike(id, user.id);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(401).send({
            message: "error",
          });
        }
      
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  commentAnswer: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const { id, text } = req.body;
        const result = await companyService.commentAnswer(id, user.id, text);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(401).send({
            message: "error",
          });
        }
      
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  commentLike: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const { id } = req.body;
        const result = await companyService.commentLike(id, user.id);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(401).send({
            message: "error",
          });
        }

    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Internal server error",
      });
    }
  },
  rating: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const { id, rating } = req.body;
        const result = await companyService.rating(id, user.id, rating);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(401).send({
            message: "error",
          });
        }
 
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Internal server error",
      });
    }
  },
  reject: async (req, res) => {
    try {
      const id = req.params.id;
      let status = req.body.status;
      const event = await companyService.reject(id, status);
      let template = "profile/company-single-rejected";
      let participants = 0;
      event.services.forEach((element) => {
        participants += element.serviceRegister.length;
      });
      console.log("event", event);

      res.render(template, {
        layout: "profile",
        title: "Company Show",
        user: req.user,
        userOwner: event.owner,
        event: event,
        services: event.services,
        images: event.images,
        phone_numbers: event.phoneNumbers,
        eventCat: event.category.name,
        participants,
        likes: event.likes.length,
        views: event.view.length,
        favorits: event.favorites.length,
        rejectMessage: event.rejectMessage,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  resolve: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await companyService.resolve(id);
      let template = "profile/company-single";
      const dbCompany = await Company.findByIdAndUpdate(id)
        .populate("images")
        .populate("services")
        .populate("phoneNumbers")
        .populate("owner");
      const user = await User.findById(dbCompany.owner);
      const eventCat = await companyCategory.findById(dbCompany.category);
      res.render(template, {
        layout: "profile",
        title: "Company Show",
        user: req.user,
        userOwner: dbCompany.owner,
        event: dbCompany,
        services: dbCompany.services,
        images: dbCompany.images,
        phone_numbers: dbCompany.phoneNumbers,
        eventCat,
      });
    } catch (error) {
      console.error(error);
    }
  },
  opportunity: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
  
        const user = jwt.decode(token);
  
        const userDb = await User.findById(user.id);
        if (userDb) {
          if (userDb.eventCompany) {
            userDb.eventCompany = false;
            await userDb.save();
          } else {
            userDb.eventCompany = true;
            await userDb.save();
          }
          res.status(200).send({ message: "success" });
        } else {
          res.status(403).send({ message: "User not found" });
        }
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
   

  },
  // confirm: async (req, res) => {
  //   try {
  //     const { companyId } = req.body;
  //     await Company.findOneAndUpdate(
  //       { _id: companyId }, // Filter criteria
  //       { $set: { status: 1 } }, // Update action
  //       { returnOriginal: false } // Return the updated document
  //     );

  //     res.status(200).send({ message: "заявка одобрена" });
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  deleteCompany: async (req, res) => {
    try {
      const { companyId } = req.body;
      const companyDb = await companyModel.findByIdAndDelete(companyId);
      res.status(200).send({ message: "успешно удалено" });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  myFavorites: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        let resultArr = [];

        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const resultFav = await CompanyFavorites.find({ userId: user.id });
        for (let i = 0; i < resultFav.length; i++) {
          const resultComp = await Company.findById(resultFav[i].companyId)
            .populate("category")
            .populate("images")
            .populate("phoneNumbers")
            .populate("services")
            .populate("likes")
            .populate("comments")
            .populate("favorites")
            .exec();
          resultArr.push(resultComp);
        }
        for (let z = 0; z < resultArr.length; z++) {

          const hours = moment.tz(process.env.TZ).format("HH:mm");
          const splitOpen = resultArr[z].startHour.split(":");
          const splitClose = resultArr[z].endHour.split(":");
          const isLiked = await companyLikes.findOne({
            userId: user.id,
            companyId: resultArr[z]._id,
          });
          if (isLiked) {
            resultArr[z].isLike = true;
          }
          const isFavorite = await companyFavorit.findOne({
            userId: user.id,
            companyId: resultArr[z]._id,
          });
          if (isFavorite) {
            resultArr[z].isFavorite = true;
          }
          const isRating = await companyRating.findOne({
            userId: user.id,
            companyId: resultArr[z]._id,
          });

          if (isRating) {
            resultArr[z].isRating = true;
          }

          if (
            Number(hours) >= Number(splitOpen[0]) &&
            Number(hours) < Number(splitClose[0])
          ) {
            resultArr[z].open = true;
          }
        }

        res.status(200).send(resultArr);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "server error" });
    }
  },
  addFavorites: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const { companyId } = req.body;

        const result = await companyService.addFavorites(user.id, companyId);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(400).send({ message: "error" });
        }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "server error" });
    }
  },
  addCommets: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { companyId, text } = req.body;
      if (!companyId || !text) {
        return res
          .status(400)
          .json({ message: "userId,Comment and companyId are required" });
      } else if (authHeader) {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);

        const date = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss");
        const newComment = new companyComment({
          userId: user.id,
          companyId,
          text,
          date,
        });
        await newComment.save();

        const company = await Company.findById(companyId).populate("comments");
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        } else {
          company.comments.push(newComment._id);
          await company.save();

          res.status(200).json({
            message: "Comment added successfully",
            company,
          });
        }
      } else {
        res.status(401).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).send({message:"Server error"});

    }
  },
  like: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { companyId } = req.body;
      if (!authHeader || !companyId) {
        return res
          .status(400)
          .json({ message: "userId and companyId are required" });
      } else {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const userId = user.id;
        const findLike = await companyLikes.find({ userId, companyId });
        if (!findLike) {
          const newLike = new companyLikes({ userId, companyId });
          await newLike.save();

          const company = await Company.findById(companyId).populate("likes");
          if (!company) {
            return res.status(404).json({ message: "Company not found" });
          } else {
            company.likes.push(newLike._id);
            await company.save();

            res.status(200).json({
              message: "Like added successfully",
              company,
            });
          }
        } else {
          await companyLikes.findByIdAndDelete(neLike._id);
          await Company.findByIdAndUpdate(companyId, {
            $pull: { likes: neLike._id },
          });
        }
      }
    } catch (error) {
      console.error("Error adding like:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  near: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const id = req.params.id;
      console.log("id", id);
      console.log("authHeader", authHeader);
      
      
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const result = await Company.findById(id)
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("ratings")
          .populate("comments");
        function calculateAverageRating(ratings) {
          if (ratings.length === 0) return 0;

          const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

          const average = total / ratings.length;

          return Math.round(average * 10) / 10; 
        }

        const averageRating = calculateAverageRating(result.ratings);
        const ifView = await companyView.findOne({
          userId: user.id,
          companyId: id,
        });
        let resultChanged1;
        if (!ifView) {
          const companyView = new companyView({
            userId: user.id,
            companyId: id,
            date: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
          });
          await companyView.save();
           resultChanged1 = await Company.findOneAndUpdate(
            { _id: id },
            {
              $push: { view: companyView._id }, 
              $set: { rating: averageRating },
            },
            { new: true } 
          )
            .populate("images")
            .populate("phoneNumbers")
            .populate("services")
            .populate("likes")
            .populate("ratings")
            .populate("comments");
        }else{
          resultChanged1 = await Company.findOneAndUpdate(
            { _id: id },
            {
              $set: { rating: averageRating }, 
            },
            { new: true }
          )
            .populate("images")
            .populate("phoneNumbers")
            .populate("services")
            .populate("likes")
            .populate("ratings")
            .populate("comments");
        }


      
        const isLiked = await companyLikes.findOne({
          userId: user.id,
          companyId: resultChanged1._id,
        });
        if (isLiked) {
          resultChanged1.isLike = true;
        }
        const isFavorite = await companyFavorit.findOne({
          userId: user.id,
          companyId: resultChanged1._id,
        });
        if (isFavorite) {
          resultChanged1.isFavorite = true;
        }
        const isRating = await companyRating.findOne({
          userId: user.id,
          companyId: resultChanged1._id,
        });

        if (isRating) {
          resultChanged1.isRating = true;
        }

        const hours = moment.tz(process.env.TZ).format("HH:mm");
        const splitOpen = resultChanged1.startHour.split(":");
        const splitClose = resultChanged1.endHour.split(":");
        await resultChanged1.save();
        if (
          Number(hours) >= Number(splitOpen[0]) &&
          Number(hours) < Number(splitClose[0])
        ) {
          result[z].open = true;
        }
        res.status(200).send(resultChanged1);
       
      } else {
        const result = await Company.findById(id)
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("ratings")
          .populate("comments");
        function calculateAverageRating(ratings) {
          if (ratings.length === 0) return 0;

          const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

          const average = total / ratings.length;

          return Math.round(average * 10) / 10;
        }

        const averageRating = calculateAverageRating(result.ratings);

        const resultChanged1 = await Company.findOneAndUpdate(
          { _id: id },
          {
            $set: { rating: averageRating },
          },
          { new: true }
        )
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("ratings")
          .populate("comments");

        const hours = moment.tz(process.env.TZ).format("HH:mm");
        const splitOpen = resultChanged1.startHour.split(":");
        const splitClose = resultChanged1.endHour.split(":");
        await resultChanged1.save();
        if (
          Number(hours) >= Number(splitOpen[0]) &&
          Number(hours) < Number(splitClose[0])
        ) {
          result[z].open = true;
        }
        res.status(200).send(resultChanged1);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  popular: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // console.log(authHeader, "authHeader");

      // console.log(body, "body company");
      if (!authHeader) {
        let dbObj = [];
        const resultCategory = await companyCategory.find();
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].image;
          obj.id = resultCategory[i]._id;

          let cats = resultCategory[i];
          const resultCompany = await Company.find({
            category: resultCategory[i]._id,
          })
            .populate("images")
            .populate("services")
            .populate({
              path: "category",
              select: "name",
            })
            .populate("phoneNumbers")
            .populate("likes")
            .populate("comments");

          for (let z = 0; z < resultCompany.length; z++) {
            // const now = new Date();

            // const hours = now.getHours();
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = resultCompany[z].startHour.split(":");
            const splitClose = resultCompany[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              resultCompany[z].open = true;
            }
          }
          obj.companies = resultCompany;
          dbObj.push(obj);
        }

        // console.log(dbObj);
        const sortArray = dbObj.sort((a, b) => {
          return b.companies.length - a.companies.length;
        });

        res.status(200).send({ message: "access", data: sortArray });
      } else {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        // const user = { id: "656ecb2e923c5a66768f4cd3" };

        let dbObj = [];
        const resultCategory = await companyCategory.find();
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].image;
          obj.id = resultCategory[i]._id;

          let cats = resultCategory[i];
          const resultCompany = await Company.find({
            category: resultCategory[i]._id,
            owner: { $ne: user.id },
          })
            .populate("images")
            .populate({
              path: "category",
              select: "name",
            })
            .populate("services")
            .populate("phoneNumbers")
            .populate("likes")
            .populate("comments");

          for (let z = 0; z < resultCompany.length; z++) {
            // const now = new Date();

            // const hours = now.getHours();
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = resultCompany[z].startHour.split(":");
            const splitClose = resultCompany[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              resultCompany[z].open = true;
            }
          }
          obj.companies = resultCompany;
          dbObj.push(obj);
        }

        // console.log(dbObj);
        const sortArray = dbObj.sort((a, b) => {
          return b.companies.length - a.companies.length;
        });

        res.status(200).send({ message: "access", data: sortArray });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  getCompanys: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader ) {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const result = await Company.find({ owner: { $ne: user.id } })
          .populate("images")
          .populate("services")
          .populate("phoneNumbers")
          .populate("likes")
          .populate("comments")
          .populate("category");
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const earthRadius = 6371;

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

          return distance;
        }
        result.forEach((company) => {
          company.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            company.coords.latit,
            company.coords.longit
          );
        });

        result.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({ message: "access", data: result });
      } else {
        const result = await Company.find()
          .populate("images")
          .populate("services")
          .populate("phoneNumbers")
          .populate("likes")
          .populate("comments")
          .populate("category");
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
        result.forEach((company) => {
          company.kilometr = calculateDistance(
            myLatitude,
            myLongitude,
            company.coords.latit,
            company.coords.longit
          );
        });

        result.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({ message: "access", data: result });
      }

    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  singl: async () => {
    try {
      let template = "profile/company-single";
      let event = await this.EventService.getById(req.params.id);
      let eventCats = await this.EventCategoryService.get();
      if (event.status && event.status != 0 && event.status != 1) {
        template += "-rejected";
      }
  
      res.render(template, {
        layout: "profile",
        title: "Event Single",
        user: req.user,
        event,
        eventCats,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }

  },
  single: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const id = req.params.id;
      const result = await Company.findById(id)
        .populate("images")
        .populate("phoneNumbers")
        .populate("services")
        .populate("likes")
        .populate("ratings")
        .populate("comments");
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
      const ifView = await companyView.findOne({
        userId: user.id,
        companyId: id,
      });
      if (!ifView) {
        const newView = new companyView({
          userId: user.id,
          companyId: id,
          date: moment.tz(process.env.TZ).format(),
        });
        await newView.save();
      }
      const companyViewtwo = new companyView({
        userId: user.id,
        companyId: id,
        date: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
      });
      await companyViewtwo.save();
      const resultChanged1 = await Company.findOneAndUpdate(
        { _id: id },
        {
          $set: { rating: averageRating }, // Set new rating
        },
        { new: true } // Return the updated document
      )        .populate("images")
      .populate("phoneNumbers")
      .populate("services")
      .populate("likes")
      .populate("ratings")
      .populate("comments");

      // for (let z = 0; z < resultChanged1.length; z++) {
      const isLiked = await companyLikes.findOne({
        userId: user.id,
        companyId: resultChanged1._id,
      });
      if (isLiked) {
        resultChanged1.isLike = true;
      }
      const isFavorite = await companyFavorit.findOne({
        userId: user.id,
        companyId: resultChanged1._id,
      });
      if (isFavorite) {
        resultChanged1.isFavorite = true;
      }
      const isRating = await companyRating.findOne({
        userId: user.id,
        companyId: resultChanged1._id,
      });

      if (isRating) {
        resultChanged1.isRating = true;
      }

      const hours = moment.tz(process.env.TZ).format("HH:mm");
      const splitOpen = resultChanged1.startHour.split(":");
      const splitClose = resultChanged1.endHour.split(":");
      await resultChanged1.save();
      if (
        Number(hours) >= Number(splitOpen[0]) &&
        Number(hours) < Number(splitClose[0])
      ) {
        result[z].open = true;
      }
      // }
      res.status(200).send(resultChanged1);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  // documents: async (req, res) => {
  //   try {
  //     const documentArray = ["", "", ""];
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  getCategory: async (req, res) => {
    try {
      const dbResult = await companyCategory.find();
      res.status(200).send({ message: "success", categories: dbResult });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  days: async (req, res) => {
    try {
      res.status(200).send(calendar);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  addCompany: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      console.log(authHeader, "authHeader");
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
   
        const data = req.body;
        console.log(data, "body company");

        const result = await companyService.addCompany(data, user.id);
        const store = async (data) => {
          console.log(data, "data1");

          let ex_notif_type = true;
          console.log(data.user && data.notif_type);
          
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

        console.log(data.name);

        const db = await Company.findOne({
          companyName: data.name,
        });
        const evLink = `alleven://eventDetail/${db._id}`;
        console.log("user.id,",user.id);
        
        await store({
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
          user: user.id,
          type: "Новая услуга",
          message: `Ваше событие ${db.companyName} находится на модерации`,
          categoryIcon: "db.images[0]",
          event: db._id,
          link: evLink,
        });
        const categor = await companyCategory.find({ _id: db.category });
        notifEvent.emit(
          "send",
          db.owner.toString(),
          JSON.stringify({
            type: "Новая услуга",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
            message: `Ваше событие ${db.companyName} находится на модерации`,
            categoryIcon: categor.image,
            link: evLink,
          })
        );

        const pushInCollection = async (user_id, col_id, col_name) => {
          let user = await User.findById(user_id);
          user[col_name].push(col_id);
          user.last_event_date = moment
            .tz(process.env.TZ)
            .format("YYYY-MM-DDTHH:mm");
          await user.save();
          return 1;
        };

        await pushInCollection(user.id, db._id, "events");


        notifEvent.emit(
          "send",
          "ADMIN",
          JSON.stringify({
            type: "Новая услуга",
            message: "event",
            data: db,
          })
        );
        res.status(200).send(result);

    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  },
  // editeCompany: async (req, res) => {
  //   try {
  //     const result = await companyService.editeCompany();
  //     res.status(200).send(result);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  addService: async (req, res) => {
    try {
      const { companyId, service } = req.body;
      const result = await companyService.addService(companyId, service);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
  },
  getMy: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const userId = user.id;
      const result = await companyService.getMy(userId);
      for (let z = 0; z < result.length; z++) {
  
        const hours = moment.tz(process.env.TZ).format("HH:mm");
        const splitOpen = result[z].startHour.split(":");
        const splitClose = result[z].endHour.split(":");
        const isLiked = await companyLikes.findOne({
          userId,
          companyId: result[z]._id,
        });
        if (isLiked) {
          result[z].isLike = true;
        }
        const isFavorite = await companyFavorit.findOne({
          userId,
          companyId: result[z]._id,
        });
        if (isFavorite) {
          result[z].isFavorite = true;
        }
        const isRating = await companyRating.findOne({
          userId,
          companyId: result[z]._id,
        });

        if (isRating) {
          result[z].isRating = true;
        }

        if (
          Number(hours) >= Number(splitOpen[0]) &&
          Number(hours) < Number(splitClose[0])
        ) {
          result[z].open = true;
        }
      }

      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});
    }
  },
  index: async (req, res) => {
    try {
      const { name, category, date_from } = req.query;
      let params = {};
      let events;
      if (name) {
        params.name = name;
        events = await Company.find({ companyName: name })
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }
  
      if (category) {
        const eventCats = await companyCategory.findById(category);
        params.category = category;
        events = await Company.find({ category: eventCats._id })
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }
  
      if (!category && !name) {
        events = await Company.find()
          .populate("owner")
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }
  
      // if (date_from) {
      //   params.started_time = {
      //     $gte: new Date(date_from).toISOString(),
      //   };
      // }
  
      const eventCats = await companyCategory.find();
  
  
      console.log("eventCats", eventCats);
      res.render("profile/company", {
        layout: "profile",
        title: "Company",
        user: req.user,
        events,
        eventCats,
        q: req.query,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({message:"Server error"});

    }
   
  },
  radius: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      console.log("req.query", req.query);

      const { lon, lan } = req.query;

      if (authHeader && lon && lan) {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);

        const myLatitude = lan;
        const myLongitude = lon;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const companies = await Company.find({
            owner: { $ne: user.id },
            status: { $eq: 1 },
          });
          function calculateDistance(lat1, lon1, lat2, lon2) {
            const earthRadius = 6371;

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

          for (let z = 0; z < companies.length; z++) {
            // const now = new Date();

            // const hours = now.getHours();
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = companies[z].startHour.split(":");
            const splitClose = companies[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              companies[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].image;
          obj.id = compCategory[z]._id;
          obj.companies = companies;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (
        authHeader &&
        authHeader !== "null" &&
        lon === "undefined" &&
        lan === "undefined"
      ) {
        const myLatitude = 55.7558;
        const myLongitude = 37.6173;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const companies = await Company.find({
            owner: { $ne: user.id },
            status: { $eq: 1 },
          });
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

          for (let z = 0; z < companies.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = companies[z].startHour.split(":");
            const splitClose = companies[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              companies[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].image;
          obj.id = compCategory[z]._id;

          obj.companies = companies;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (!authHeader && lon && lan) {
        const myLatitude = lan;
        const myLongitude = lon;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const companies = await Company.find({
            status: { $eq: 1 },
          });
          function calculateDistance(lat1, lon1, lat2, lon2) {
            const earthRadius = 6371;

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

          for (let z = 0; z < companies.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = companies[z].startHour.split(":");
            const splitClose = companies[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              companies[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].image;
          obj.id = compCategory[z]._id;

          obj.companies = companies;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (!authHeader && lon === "undefined" && lan === "undefined") {
        const myLatitude = 55.7558;
        const myLongitude = 37.6173;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const companies = await Company.find({
            status: { $eq: 1 },
          });
          function calculateDistance(lat1, lon1, lat2, lon2) {
            const earthRadius = 6371;

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

          for (let z = 0; z < companies.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = companies[z].startHour.split(":");
            const splitClose = companies[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              companies[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].image;
          obj.id = compCategory[z]._id;
          obj.companies = companies;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else {
        res.status(400).send({
          message: "Error",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Error",
      });
    }
  },
};

export default companyController;
