import companyCategory from "../../../models/company/companyCategory.js";
import calendar from "../../../public/calendar/calendar.js";
import companyService from "../../../services/CompanyService.js";
import Company from "../../../models/company/companyModel.js";
import notifEvent from "../../../events/NotificationEvent.js";
import companyServiceDb from "../../../models/company/companyService.js";
import Role from "../../../models/Role.js";
import Notification from "../../../models/Notification.js";
import User from "../../../models/User.js";
import moment from "moment";
import jwt from "jsonwebtoken";
import companyLikes from "../../../models/company/companyLikes.js";
import companyComment from "../../../models/company/companyComment.js";
import CompanyFavorites from "../../../models/company/companyFavorit.js";
import companyModel from "../../../models/company/companyModel.js";
import companyFavorit from "../../../models/company/companyFavorit.js";
import companyRating from "../../../models/company/companyRating.js";
import servicesRegistrations from "../../../models/services/servicesRegistrations.js";
import companyView from "../../../models/company/companyView.js";
import companyImage from "../../../models/company/companyImage.js";
import companyImpressionImages from "../../../models/company/companyImpressionImages.js";
import companyCommentAnswerLike from "../../../models/company/companyCommentAnswerLike.js";
import companyCommentLike from "../../../models/company/companyCommentLike.js";
import companyCommentAnswer from "../../../models/company/companyCommentAnswer.js";
import companyHotDeals from "../../../models/company/companyHotDeals.js";
import companyPhones from "../../../models/company/companyPhones.js";

const companyController = {
  // dealsRegisters: async (req, res) => {
  //   const { id } = req.params;
  //   const result = await companyService.dealsRegisters(id);
  //   res.status(200).send({message:"success",data:result});
  // },
  serviceUpdate: async (req, res) => {
    try {
      const { id, data } = req.body;
      const result = await companyService.serviceUpdate(id, data);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  deatRegister: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const { dealId } = req.body;
      const result = await companyService.deatRegister(dealId, user.id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  addHotDeals: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // if(authHeader){
      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);
      const { companyId, description, cost, date } = req.body;
     

      const result = await companyService.addHotDeals(
        companyId,
        description,
        cost,
        date
      );
      res.status(200).send(result);
      // }else{
      //   res.status(400).send({message:"Authorization error"});
      // }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  companyEdit: async (req, res) => {
    const data = req.body;
    const result = await companyService.companyEdit(data);
    res.send(result);
  },
  impressionImagesStore: async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    const { id, path } = req.body;
    const result = await companyService.impressionImagesStore(
      id,
      path,
      user.id
    );

    const data = await companyImpressionImages
      .findById(result._id)
      .populate({ path: "user", select: "name surname avatar" });
    return res
      .status(200)
      .send({ updated: result.bool, success: true, data: result.result });
  },
  deleteService: async (req, res) => {
    const serviceId = req.params.id;
    const result = await companyService.deleteService(serviceId);
    return res.status(200).send(result);
  },
  destroyCompanyImage: async (req, res) => {
    const result = await companyService.destroyCompanyImage(req.params.id);
    return res.status(200).send(result);
  },
  addImage: async (req, res) => {
    const { id, path } = req.body;
    const result = await companyService.addImage(id, path);
    return res.status(200).send(result);
  },
  destroyCompany: async (req, res) => {
    const des_events = req.body.des_events;
    let event = await companyService.destroyCompany(des_events);
    return res.redirect("back");
  },
  companyShow: async (req, res) => {
    const event = await companyModel
      .findById(req.params.id)
      .populate("images")
      .populate("services")
      .populate("phoneNumbers")
      .populate("category")
      .populate({ path: "owner", select: "-password" })
      .populate("likes")
      .populate("comments");
    // const user=await User.findById(event.owner)
    const comments = await companyComment
      .find({ companyId: event._id, user: event.owner })
      .populate({ path: "user", select: "-password" });

    res.render("profile/company-show", {
      layout: "profile",
      title: "Company Show",
      user: req.user,
      event,
      eventCat: event.category,
      // eventCats,
      services: event.services,
      images: event.images,
      phone_numbers: event.phoneNumbers,
      userOwner: event.owner,
      comments: comments,
    });
    // res.render("profile/company-show", {
    //   layout: "profile",
    //   title: "Company View",
    //   user: req.user,
    //   event,
    //   q: req.query,
    // });
  },
  singleCompany: async (req, res) => {
    let template = "profile/company-single";
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
    // let eventCats= await companyCategory.find()
    if (event.status && event.status != 0 && event.status != 1) {
      template += "-rejected";
    }



    res.render(template, {
      layout: "profile",
      title: "Company Single",
      user: req.user,
      userOwner: user,
      event,
      eventCat,
      // eventCats,
      services: event.services,
      images: event.images,
      phone_numbers: event.phoneNumbers,
      favorite: favorite.length,
      likes: event.likes.length,
      registr,
      statusMessage: event.rejectMessage,
    });
  },
  commentDelete: async (req, res) => {
    try {
      const { id } = req.body;
      const result = await companyService.commentDelete(id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  commentAnswerDelete: async (req, res) => {
    try {
      const { id } = req.body;
      const result = await companyService.commentAnswerDelete(id);
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  OnlineReject: async (req, res) => {
    try {
      const id = req.params.id;
      let status = req.body.status;
      const event = await companyService.onlineReject(id, status);
      let template = "profile/companyPay-single-rejected";
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
      res.status(500).send({ message: "Server error" });
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
        .populate({ path: "owner", select: "-password" });
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
      res.status(500).send({ message: "Server error" });
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
      res.status(500).send({ message: "Server error" });
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
          .populate({ path: "owner", select: "-password" })
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
          .populate({ path: "owner", select: "-password" })
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }

      if (!category && !name) {
        events = await Company.find()
          .populate({ path: "owner", select: "-password" })
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
      const { answerId } = req.body;
      const result = await companyService.commentAnswerLike(answerId, user.id);
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
      const { commentId, text } = req.body;

      const result = await companyService.commentAnswer(
        commentId,
        user.id,
        text
      );
      if (result) {
        const answer = await companyCommentAnswer
          .findById(result._id)
          .populate({ path: "user", select: "name surname avatar" });
        res.status(200).send({ success: true, answer });
      } else {
        res.status(401).send({
          success: false,
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
      const { commentId } = req.body;
      const result = await companyService.commentLike(commentId, user.id);
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
      res.status(500).send({ message: "Server error" });
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
        .populate({ path: "owner", select: "-password" })
        .populate("category");
      const user = await User.findById(dbCompany.owner);
      const eventCat = await companyCategory.findById(dbCompany.category);
  
      const evLink = `alleven://companyDetail/${dbCompany._id}`;

      const dataNotif = {
        status: 2,
        date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
        user: dbCompany.owner._id.toString(),
        type: "Новая услуга",
        message: `${dbCompany.companyName} и услуги добавлены в приложение.`,
        meeting: dbCompany._id,
        link: evLink,
      };
     const nt= new Notification(dataNotif);
     await nt.save();
      notifEvent.emit(
        "send",
        dbCompany.owner._id.toString(),
        JSON.stringify({
          type: "Новая услуга",
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
          message: `${dbCompany.companyName} и услуги добавлены в приложение.`,
          categoryIcon: dbCompany.category.avatar, //sarqel
          link: evLink,
        })
      );

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
      res.status(500).send({ message: "Server error" });
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
      const company = await Company.findById(req.params.id);

      if (!company) {
        throw new Error("Meeting not found");
      }

      // Find all related comments
      const comments = await companyComment.find({ companyId: req.params.id });

      // For each comment, delete related answers and likes
      for (const comment of comments) {
        // Delete all likes related to the comment
        await companyCommentLike.deleteMany({ commentId: comment._id });

        // Find all answers related to the comment
        const answers = await companyCommentAnswer.find({
          commentId: comment._id,
        });

        // For each answer, delete related likes
        for (const answer of answers) {
          await companyCommentAnswerLike.deleteMany({ answerId: answer._id });
        }

        // Delete all answers related to the comment
        await companyCommentAnswer.deleteMany({ commentId: comment._id });
      }

      // Delete all related services registers
      // const services=await companyServiceDb.find({ companyId: req.params.id });
      // for (let i = 0; i < services.length; i++) {
      //   const serviceRegistr = await servicesRegistrations.findOneAndRemove({
      //     serviceId: services[i]._id,
      //   });
      // }

      // Delete all comments related to the meeting
      await companyComment.deleteMany({ companyId: req.params.id });
      await companyImage.deleteMany({ companyId: req.params.id });
      await companyLikes.deleteMany({ companyId: req.params.id });
      await companyFavorit.deleteMany({ companyId: req.params.id });
      await companyView.deleteMany({ companyId: req.params.id });
      await companyRating.deleteMany({ companyId: req.params.id });
      await companyPhones.deleteMany({ companyId: req.params.id });
      await companyServiceDb.deleteMany({ companyId: req.params.id });
      await companyImpressionImages.deleteMany({ companyId: req.params.id });
      await User.findByIdAndUpdate(company.owner.toString(), {
        $set: { company: null },
        $pull: {
          company_favorites: company._id,
          company_likes: company._id,
          company_views: company._id,
          company_ratings: company._id,
        },
      });
      await company.remove();

      console.log("Meeting and all related data deleted successfully");
      // const companyDb = await Company.findById(req.params.id);
      // // const userDb=await User.findById(companyDb.owner.toString());
      // await User.findByIdAndUpdate(companyDb.owner.toString(),{$pull:{company:companyDb._id}});
      // for (let i = 0; i < companyDb.services.length; i++) {
      //   const service = await companyServiceDb.findByIdAndDelete(
      //     companyDb.services[i].serviceId
      //   );
      // }
      // for (let i = 0; i < companyDb.images.length; i++) {
      //   const image = await companyImage.findByIdAndDelete(
      //     companyDb.images[i].imageId
      //   );
      // }
      // await Company.findByIdAndDelete(req.params.id);
      res.status(200).send({ success: true, message: "успешно удалено" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Server error" });
    }
  },
  myFavorites: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let resultArr = [];

      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const resultFav = await CompanyFavorites.find({ user: user.id });
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
          user: user.id,
          companyId: resultArr[z]._id,
        });
        if (isLiked) {
          resultArr[z].isLike = true;
        }
        const isFavorite = await companyFavorit.findOne({
          user: user.id,
          companyId: resultArr[z]._id,
        });
        if (isFavorite) {
          resultArr[z].isFavorite = true;
        }
        const isRating = await companyRating.findOne({
          user: user.id,
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

      if (authHeader) {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);

        const date = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss");
        const newComment = new companyComment({
          user: user.id,
          companyId,
          text,
          date,
        });
        await newComment.save();

        const company = await Company.findById(companyId).populate("comments");

        company.comments.push(newComment._id);
        await company.save();
        const resultChanged1 = await Company.findById(companyId)
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("ratings")
          .populate({
            path: "comments",
            populate: { path: "user", select: "-password" },
          });
        // for (let i = 0; i < resultChanged1.comments.length; i++) {
        //   let object = {};
        //   const commentsLength = await companyComment.find({
        //     user: resultChanged1.comments[i].user._id.toString(),
        //     companyId: resultChanged1._id.toString(),
        //   });
        //   object.comments_count = commentsLength.length;
        //   object.avatar = resultChanged1.comments[i].user.avatar;
        //   object.name = resultChanged1.comments[i].user.name;
        //   object.surname = resultChanged1.comments[i].user.surname;
        //   object.text = resultChanged1.comments[i].text;

        //   // const commRating = await companyRating.findOne({
        //   //   user: resultChanged1.comments[i].user._id.toString(),
        //   //   companyId: resultChanged1._id.toString(),
        //   // });

        //   resultChanged1.impressions.push(object);
        // }
        // resultChanged1.impressions.reverse();
        const sendComment = await companyComment
          .findById(newComment._id)
          .populate({ path: "user", select: "name surname avatar" });
        res.status(200).send({
          comment: sendComment,
        });
        // }
      } else {
        res.status(401).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).send({ message: "Server error" });
    }
  },
  like: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { companyId } = req.body;
      const token = authHeader.split(" ")[1];

      const userToken = jwt.decode(token);
      const user = userToken.id;
      const findLike = await companyLikes.find({ user, companyId });
      if (!findLike) {
        const newLike = new companyLikes({ user, companyId });
        await newLike.save();

        const company = await Company.findById(companyId).populate("likes");
        company.likes.push(newLike._id);
        await company.save();

        res.status(200).json({
          message: "Like added successfully",
          company,
        });
        // }
      } else {
        await companyLikes.findByIdAndDelete(findLike._id);
        const company = await Company.findByIdAndUpdate(
          companyId,
          { $pull: { likes: findLike._id } },
          { new: true }
        );

        res.status(200).json({
          message: "Like deleted successfully",
          company,
        });
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

      const compUpdate = await Company.findById(id);
      compUpdate.isLike = false;
      compUpdate.isRating = false;
      compUpdate.isFavorite = false;
      await compUpdate.save();

      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const result = await Company.findById(id).populate("ratings");

        function calculateAverageRating(ratings) {
          if (ratings.length === 0) return 0;

          const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

          const average = total / ratings.length;

          return Math.round(average * 10) / 10;
        }
        let resultChanged1;
        const averageRating = calculateAverageRating(result.ratings);
        const ifView = await companyView.findOne({
          user: user.id,
          companyId: id,
        });
 

        if (!ifView) {
          const companyViewOne = new companyView({
            user: user.id,
            companyId: id,
            date: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
          });
          await companyViewOne.save();
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
            .populate({
              path: "comments",
              populate: [
                {
                  path: "user",
                  select: "avatar name surname", // Select only the avatar and name fields from user
                },
                {
                  path: "answer",
                  select: "isLike text date likes",
                  populate: { path: "user", select: "avatar name surname" }, // Select only the content and likes fields from answer
                },
              ],
            })
            .populate("hotDeals")
            .populate({
              path: "impression_images",
              populate: { path: "user", select: "name surname avatar" },
            });
          for (let i = 0; i < resultChanged1.comments.length; i++) {
            for (let z = 0; z < resultChanged1.comments[i].answer.length; z++) {
              const findLike = await companyCommentAnswerLike.findOne({
                user: user.id,
                answerId: resultChanged1.comments[i].answer[z]._id,
              });
              if (findLike) {
                resultChanged1.comments[i].answer[z].isLike = true;
              }
            }
            const findCommentLike = await companyCommentLike.findOne({
              user: user.id,
              commentId: resultChanged1.comments[i]._id,
            });
            if (findCommentLike) {
              resultChanged1.comments[i].isLike = true;
            }
          }
          let upcomingDeals = [];
          for (let i = 0; i < resultChanged1.hotDeals.length; i++) {
            const fixedTime = moment.tz(
              resultChanged1.hotDeals[i].date,
              "YYYY-MM-DD HH:mm",
              process.env.TZ
            );


            // Check if the fixed time is after now
            const now = moment.tz(process.env.TZ);
            if (fixedTime.isAfter(now)) {
              upcomingDeals.push(resultChanged1.hotDeals[i]);

            } else {
              await companyHotDeals.findByIdAndUpdate(
                resultChanged1.hotDeals[i]._id,
                { $set: { situation: "passed" } }
              );
            }
          }
          resultChanged1.hotDeals = upcomingDeals;
        } else {
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
            .populate({
              path: "comments",
              populate: [
                {
                  path: "user",
                  select: "avatar name surname", // Select only the avatar and name fields from user
                },
                {
                  path: "answer",
                  select: "isLike text date likes",
                  populate: { path: "user", select: "avatar name surname" }, // Select only the content and likes fields from answer
                },
              ],
            })
            .populate("hotDeals")
            .populate({
              path: "impression_images",
              populate: { path: "user", select: "name surname avatar" },
            });
          let upcomingDeals = [];
          for (let i = 0; i < resultChanged1.hotDeals.length; i++) {
            const fixedTime = moment.tz(
              resultChanged1.hotDeals[i].date,
              "YYYY-MM-DD HH:mm",
              process.env.TZ
            );


            const now = moment.tz(process.env.TZ);
            if (fixedTime.isAfter(now)) {
              upcomingDeals.push(resultChanged1.hotDeals[i]);

            } else {
              await companyHotDeals.findByIdAndUpdate(
                resultChanged1.hotDeals[i]._id,
                { $set: { situation: "passed" } }
              );
            }
          }
          resultChanged1.hotDeals = upcomingDeals;
        }

        const isLiked = await companyLikes.findOne({
          user: user.id,
          companyId: resultChanged1._id,
        });
        if (isLiked) {
          resultChanged1.isLike = true;
        }
        const isFavorite = await companyFavorit.findOne({
          user: user.id,
          companyId: resultChanged1._id,
        });
        if (isFavorite) {
          resultChanged1.isFavorite = true;
        }

        const isRating = await companyRating.findOne({
          user: user.id,
          companyId: resultChanged1._id.toString(),
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
          resultChanged1.open = true;
        }

        // for (let i = 0; i < resultChanged1.comments.length; i++) {
        //   let object = {};
        //   const commentsLength = await companyComment.find({
        //     user: resultChanged1.comments[i].user._id.toString(),
        //     companyId: resultChanged1._id.toString(),
        //   });
        //   object.comments_count = commentsLength.length;
        //   object.avatar = resultChanged1.comments[i].user.avatar;
        //   object.name = resultChanged1.comments[i].user.name;
        //   object.surname = resultChanged1.comments[i].user.surname;
        //   object.text = resultChanged1.comments[i].text;

        //   const commRating = await companyRating.findOne({
        //     user: resultChanged1.comments[i].user._id.toString(),
        //     companyId: resultChanged1._id.toString(),
        //   });

        //   if (commRating) {
        //     let ratingObject = {};
        //     ratingObject.date = isRating.date;
        //     ratingObject.rating = isRating.rating;
        //     object.rating = ratingObject;
        //   } else {
        //     object.rating = null;
        //   }
        //   resultChanged1.impressions.push(object);
        // }
        // resultChanged1.impressions.reverse();
        for (let i = 0; i < resultChanged1.comments.length; i++) {
          for (let z = 0; z < resultChanged1.comments[i].answer.length; z++) {
            const findLike = await companyCommentAnswerLike.findOne({
              user: user.id,
              answerId: resultChanged1.comments[i].answer[z]._id,
            });
            if (findLike) {
              resultChanged1.comments[i].answer[z].isLike = true;
            }
          }
          const findCommentLike = await companyCommentLike.findOne({
            user: user.id,
            commentId: resultChanged1.comments[i]._id,
          });
          if (findCommentLike) {
            resultChanged1.comments[i].isLike = true;
          }
        }
        res.status(200).send(resultChanged1);
      } else {
        const result = await Company.findById(id)
          // .populate("images")
          // .populate("phoneNumbers")
          // .populate("services")
          // .populate("likes")
          .populate("ratings");
        // .populate({
        //   path: "comments",
        //   populate: [
        //     {
        //       path: "user",
        //       select: "avatar name surname", // Select only the avatar and name fields from user
        //     },
        //     {
        //       path: "answer",
        //       select: "isLike text date likes",
        //       populate: { path: "user", select: "avatar name surname" }, // Select only the content and likes fields from answer
        //     },
        //   ],
        // })
        // .populate("hotDeals")
        // .populate({
        //   path: "impression_images",
        //   populate: { path: "user", select: "name surname avatar" },
        // });
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
          .populate({
            path: "comments",
            populate: [
              {
                path: "user",
                select: "avatar name surname", // Select only the avatar and name fields from user
              },
              {
                path: "answer",
                select: "isLike text date likes",
                populate: { path: "user", select: "avatar name surname" }, // Select only the content and likes fields from answer
              },
            ],
          })
          .populate("hotDeals")
          .populate({
            path: "impression_images",
            populate: { path: "user", select: "name surname avatar" },
          });

        const hours = moment.tz(process.env.TZ).format("HH:mm");
        const splitOpen = resultChanged1.startHour.split(":");
        const splitClose = resultChanged1.endHour.split(":");
        await resultChanged1.save();
        if (
          Number(hours) >= Number(splitOpen[0]) &&
          Number(hours) < Number(splitClose[0])
        ) {
          resultChanged1.open = true;
        }
        // resultChanged1.share=`/company/${resultChanged1._id}`
        // for (let i = 0; i < resultChanged1.comments.length; i++) {
        //   let object = {};
        //   const commentsLength = await companyComment.find({
        //     user: resultChanged1.comments[i].user._id.toString(),
        //     companyId: resultChanged1._id.toString(),
        //   });
        //   object.comments_count = commentsLength.length;
        //   object.avatar = resultChanged1.comments[i].user.avatar;
        //   object.name = resultChanged1.comments[i].user.name;
        //   object.surname = resultChanged1.comments[i].user.surname;
        //   object.text = resultChanged1.comments[i].text;

        //   const commRating = await companyRating.findOne({
        //     user: resultChanged1.comments[i].user._id.toString(),
        //     companyId: resultChanged1._id.toString(),
        //   });

        //   // if (commRating) {
        //   //   let ratingObject = {};
        //   //   ratingObject.date = isRating.date;
        //   //   ratingObject.rating = isRating.rating;
        //   //   object.rating = ratingObject;
        //   // } else {
        //   //   object.rating = null;
        //   // }
        //   resultChanged1.impressions.push(object);
        // }
        // resultChanged1.impressions.reverse();
        let upcomingDeals = [];
        for (let i = 0; i < resultChanged1.hotDeals.length; i++) {
          const fixedTime = moment.tz(
            resultChanged1.hotDeals[i].date,
            "YYYY-MM-DD HH:mm",
            process.env.TZ
          );


          const now = moment.tz(process.env.TZ);
          if (fixedTime.isAfter(now)) {
            upcomingDeals.push(resultChanged1.hotDeals[i]);

          } else {
            await companyHotDeals.findByIdAndUpdate(
              resultChanged1.hotDeals[i]._id,
              { $set: { situation: "passed" } }
            );
          }
        }
        resultChanged1.hotDeals = upcomingDeals;
        res.status(200).send(resultChanged1);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  popular: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        let dbObj = [];
        const resultCategory = await companyCategory.find();
        for (let i = 0; i < resultCategory.length; i++) {
          let obj = {};
          obj.category = resultCategory[i].name;
          obj.avatar = resultCategory[i].avatar;
          obj.id = resultCategory[i]._id;

          let cats = resultCategory[i];
          const resultCompany = await Company.find({
            category: resultCategory[i]._id,
          })
            .populate("images")
            .populate("services")
            .populate({
              path: "category",
              select: "name avatar",
            })
            // .populate("phoneNumbers")
            // .populate("likes")
            .populate("hotDeals");
          // .populate("comments");

          for (let z = 0; z < resultCompany.length; z++) {
            // const now = new Date();
            let upcomingDeals = [];
            for (let i = 0; i < resultCompany[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                resultCompany[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(resultCompany[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  resultCompany[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            resultCompany[z].hotDeals = upcomingDeals;
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
          obj.company = resultCompany;
          dbObj.push(obj);
        }

        const sortArray = dbObj.sort((a, b) => {
          return b.company.length - a.company.length;
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
          obj.avatar = resultCategory[i].avatar;
          obj.id = resultCategory[i]._id;

          let cats = resultCategory[i];
          const resultCompany = await Company.find({
            category: resultCategory[i]._id,
            owner: { $ne: user.id },
          })
            .populate("images")
            .populate({
              path: "category",
              select: "name avatar",
            })
            .populate("services")
            // .populate("phoneNumbers")
            // .populate("likes")
            .populate("hotDeals");
          // .populate("comments");

          for (let z = 0; z < resultCompany.length; z++) {
            // const now = new Date();
            let upcomingDeals = [];
            for (let i = 0; i < resultCompany[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                resultCompany[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              // Check if the fixed time is after now
              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(resultCompany[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  resultCompany[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            resultCompany[z].hotDeals = upcomingDeals;
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
          obj.company = resultCompany;
          dbObj.push(obj);
        }

        const sortArray = dbObj.sort((a, b) => {
          return b.company.length - a.company.length;
        });

        res.status(200).send({ message: "access", data: sortArray });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  getCompanys: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(" ")[1];

        const user = jwt.decode(token);
        const result = await Company.find({ owner: { $ne: user.id } })
          .populate("images")
          // .populate("services")
          // .populate("phoneNumbers")
          // .populate("likes")
          // .populate("comments")
          .populate("hotDeals")
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
            company.latitude,
            company.longitude
          );
        });
        for (let z = 0; z < result.length; z++) {
          // const now = new Date();
          let upcomingDeals = [];
          for (let i = 0; i < result[z].hotDeals.length; i++) {
            const dealTime = "2024-12-02 15:00";
            const fixedTime = moment.tz(
              result[z].hotDeals[i].date,
              "YYYY-MM-DD HH:mm",
              process.env.TZ
            );


            // Check if the fixed time is after now
            const now = moment.tz(process.env.TZ);
            if (fixedTime.isAfter(now)) {
              upcomingDeals.push(result[z].hotDeals[i]);

            } else {
              await companyHotDeals.findByIdAndUpdate(
                result[z].hotDeals[i]._id,
                { $set: { situation: "passed" } }
              );
            }
          }
          result[z].hotDeals = upcomingDeals;
          // const hours = now.getHours();
          const hours = moment.tz(process.env.TZ).format("HH:mm");
          const splitOpen = result[z].startHour.split(":");
          const splitClose = result[z].endHour.split(":");

          if (
            Number(hours) >= Number(splitOpen[0]) &&
            Number(hours) < Number(splitClose[0])
          ) {
            result[z].open = true;
          }
        }

        result.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({ message: "access", data: result });
      } else {
        const result = await Company.find()
          .populate("images")
          // .populate("services")
          // .populate("phoneNumbers")
          // .populate("likes")
          // .populate("comments")
          .populate("hotDeals")
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
            company.latitude,
            company.longitude
          );
        });
        for (let z = 0; z < result.length; z++) {
          // const now = new Date();
          let upcomingDeals = [];
          for (let i = 0; i < result[z].hotDeals.length; i++) {
            const dealTime = "2024-12-02 15:00";
            const fixedTime = moment.tz(
              result[z].hotDeals[i].date,
              "YYYY-MM-DD HH:mm",
              process.env.TZ
            );


            // Check if the fixed time is after now
            const now = moment.tz(process.env.TZ);
            if (fixedTime.isAfter(now)) {
              upcomingDeals.push(result[z].hotDeals[i]);

            } else {
              await companyHotDeals.findByIdAndUpdate(
                result[z].hotDeals[i]._id,
                { $set: { situation: "passed" } }
              );
            }
          }
          resultCompany[z].hotDeals = upcomingDeals;
          // const hours = now.getHours();
          const hours = moment.tz(process.env.TZ).format("HH:mm");
          const splitOpen = result[z].startHour.split(":");
          const splitClose = result[z].endHour.split(":");

          if (
            Number(hours) >= Number(splitOpen[0]) &&
            Number(hours) < Number(splitClose[0])
          ) {
            result[z].open = true;
          }
        }
        result.sort((a, b) => a.kilometr - b.kilometr);
        res.status(200).send({ message: "access", data: result });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
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
      res.status(500).send({ message: "Server error" });
    }
  },
  single: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const token = authHeader.split(" ")[1];
      const user = jwt.decode(token);

      const userDb = await User.findById(user.id).populate("company");
      const compUpdate = await Company.findById(userDb.company._id);
      compUpdate.isLike = false;
      compUpdate.isRating = false;
      compUpdate.isFavorite = false;
      await compUpdate.save();
      const result = await Company.findById(userDb.company._id)
        .populate("ratings")

        .exec();
      function calculateAverageRating(ratings) {
        if (ratings.length === 0) return 0;

        // Sum all the ratings
        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);

        // Calculate the average
        const average = total / ratings.length;

        return Math.round(average * 10) / 10; // Rounds to 1 decimal place
      }

      const averageRating = calculateAverageRating(result.ratings);
  
      const resultChanged1 = await Company.findOneAndUpdate(
        { _id: userDb.company._id },
        {
          $set: { rating: averageRating }, // Set new rating
        },
        { new: true } // Return the updated document
      )
        .populate("images")
        .populate({ path: "category", select: "name avatar" })
        .populate("phoneNumbers")
        .populate("services")
        .populate("likes")
        .populate("ratings")
        .populate("hotDeals")
        .populate({
          path: "participants",
          select: "name surname avatar phone_number",
        })
        .populate({
          path: "comments",
          populate: [
            {
              path: "user",
              select: "avatar name", // Select only the avatar and name fields from user
            },
            {
              path: "answer",
              select: "isLike text date likes",
              populate: { path: "user", select: "avatar name surname" }, // Select only the content and likes fields from answer
            },
          ],
        })
        .populate({
          path: "impression_images",
          populate: { path: "user", select: "name surname avatar" },
        });

      const isLiked = await companyLikes.findOne({
        user: user.id,
        companyId: resultChanged1._id,
      });
      if (isLiked) {
        resultChanged1.isLike = true;
      }
      const isFavorite = await companyFavorit.findOne({
        user: user.id,
        companyId: resultChanged1._id,
      });
      if (isFavorite) {
        resultChanged1.isFavorite = true;
      }
      const isRating = await companyRating.findOne({
        user: user.id,
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
        resultChanged1.open = true;
      }
     
      for (let i = 0; i < resultChanged1.comments.length; i++) {
        for (let z = 0; z < resultChanged1.comments[i].answer.length; z++) {
          const findLike = await companyCommentAnswerLike.findOne({
            user: user.id,
            answerId: resultChanged1.comments[i].answer[z]._id,
          });
          if (findLike) {
            resultChanged1.comments[i].answer[z].isLike = true;
          }
        }
        const findCommentLike = await companyCommentLike.findOne({
          user: user.id,
          commentId: resultChanged1.comments[i]._id,
        });
        if (findCommentLike) {
          resultChanged1.comments[i].isLike = true;
        }
      }
      let upcomingDeals = [];
      for (let i = 0; i < resultChanged1.hotDeals.length; i++) {
        const dealTime = "2024-12-02 15:00";
        const fixedTime = moment.tz(
          resultChanged1.hotDeals[i].date,
          "YYYY-MM-DD HH:mm",
          process.env.TZ
        );


        // Check if the fixed time is after now
        const now = moment.tz(process.env.TZ);
        if (fixedTime.isAfter(now)) {
          upcomingDeals.push(resultChanged1.hotDeals[i]);

        } else {
          await companyHotDeals.findByIdAndUpdate(
            resultChanged1.hotDeals[i]._id,
            {
              $set: {
                situation: "passed",
              },
            }
          );
        }
      }
      resultChanged1.hotDeals = upcomingDeals;
      const today = moment.tz(process.env.TZ).format("YYYY-MM-DD");
      const tomorrow = moment.tz(process.env.TZ).add(1, 'day').format("YYYY-MM-DD"); // Add 1 day to today's date

     let countToday = [];
      let countAfter = [];
for (let i = 0; i < resultChanged1.services.length; i++) {
  // const element = array[i];
  
     const serviceRegisterToday = await servicesRegistrations.find({
          serviceId: resultChanged1.services[i]._id,
          date: { $regex: `^${today}` },
        });
        
        const serviceRegisterAfter = await servicesRegistrations.find({
          serviceId: resultChanged1.services[i],
          date: { $gt: tomorrow }, // Matches today and dates after today
        });
        
        countAfter.push(serviceRegisterAfter.length);
        countToday.push(serviceRegisterToday.length);
      ;}
      resultChanged1.todayRegisters=countToday.reduce((a, b) => a + b, 0);
      resultChanged1.afterRegisters=countAfter.reduce((a, b) => a + b, 0);
      
      // resultChanged1.todayRegisters = countToday;
      // resultChanged1.afterRegisters = countAfter;
      res.status(200).send(resultChanged1);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
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
      res.status(500).send({ message: "Server error" });
    }
  },
  days: async (req, res) => {
    try {
      res.status(200).send(calendar);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  addCompany: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];

      const user = jwt.decode(token);
      const userDB = await User.findById(user.id);
      const companyDb = await companyModel.findOne({
        owner: userDB._id.toString(),
      });

      if (!companyDb) {
        const data = req.body;

        const result = await companyService.addCompany(data, user.id);


        const db = await Company.findById(result.company._id);
        const evLink = `alleven://eventDetail/${db._id}`;
        const dataNotif = {
          status: 2,
          date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
          user: user.id,
          type: "Новая услуга",
          message: `Ваше ${db.companyName} и услуги находится на модерации`,
          event: db._id,
          link: evLink,
        };
        let role = await Role.findOne({ name: "USER" });
        dataNotif.sent = role;
        const nt= new Notification(dataNotif);
        await nt.save();
        const categor = await companyCategory.find({ _id: db.category });
        notifEvent.emit(
          "send",
          db.owner.toString(),
          JSON.stringify({
            type: "Новая услуга",
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
            message: `Ваше ${db.companyName} и услуги находится на модерации`,
            categoryIcon: categor.avatar,
            link: evLink,
          })
        );

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
      } else {
        res.status(200).send({ message: "у вас уже добавлена ​​услуга" });
      }
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
      const { companyId, type, description, cost, images } = req.body;

      // type: service.type,
      // companyId: companyId,
      // description: service.description,
      // cost: service.cost,
      // images: service.images,
      const result = await companyService.addService(
        companyId,
        type,
        description,
        cost,
        images
      );
      res.status(200).send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  },
  // getMy: async (req, res) => {
  //   try {
  //     const authHeader = req.headers.authorization;

  //     const token = authHeader.split(" ")[1];

  //     const userToken = jwt.decode(token);
  //     const user = userToken.id;
  //     const result = await companyService.getMy(user);
  //     for (let z = 0; z < result.length; z++) {
  //       const hours = moment.tz(process.env.TZ).format("HH:mm");
  //       const splitOpen = result[z].startHour.split(":");
  //       const splitClose = result[z].endHour.split(":");
  //       const isLiked = await companyLikes.findOne({
  //         user,
  //         companyId: result[z]._id,
  //       });
  //       if (isLiked) {
  //         result[z].isLike = true;
  //       }
  //       const isFavorite = await companyFavorit.findOne({
  //         user,
  //         companyId: result[z]._id,
  //       });
  //       if (isFavorite) {
  //         result[z].isFavorite = true;
  //       }
  //       const isRating = await companyRating.findOne({
  //         user,
  //         companyId: result[z]._id,
  //       });

  //       if (isRating) {
  //         result[z].isRating = true;
  //       }

  //       if (
  //         Number(hours) >= Number(splitOpen[0]) &&
  //         Number(hours) < Number(splitClose[0])
  //       ) {
  //         result[z].open = true;
  //       }
  //     }
  //     // for (let z = 0; z < result.length; z++) {
  //     // for (let i = 0; i < result[z].services.length; i++) {

  //     // }
  //     // }

  //     res.status(200).send(result);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send({ message: "Server error" });
  //   }
  // },
  index: async (req, res) => {
    try {
      const { name, category, date_from } = req.query;
      let params = {};
      let events;
      if (name) {
        params.name = name;
        events = await Company.find({ companyName: name })
          .populate({ path: "owner", select: "-password" })
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
          .populate({ path: "owner", select: "-password" })
          .populate("images")
          .populate("phoneNumbers")
          .populate("services")
          .populate("likes")
          .populate("category");
      }

      if (!category && !name) {
        events = await Company.find()
          .populate({ path: "owner", select: "-password" })
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
      res.status(500).send({ message: "Server error" });
    }
  },
  radius: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      const { longitude, latitude } = req.query;

      if (authHeader && longitude && latitude) {
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);

        const myLatitude = latitude;
        const myLongitude = longitude;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const company = await Company.find({
            owner: { $ne: user.id },
            status: { $eq: 1 },
          })
            .populate("images")
            .populate({
              path: "services",
              populate: { path: "serviceRegister" },
            })
            .populate("phoneNumbers")
            .populate("category")
            .populate({ path: "owner", select: "-password" })
            .populate("likes")
            .populate("hotDeals")
            .populate("comments");
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
          company.forEach((company) => {
            company.kilometr = calculateDistance(
              myLatitude,
              myLongitude,
              company.latitude,
              company.longitude
            );
          });

          company.sort((a, b) => a.kilometr - b.kilometr);

          for (let z = 0; z < company.length; z++) {
            // const now = new Date();
            let upcomingDeals = [];
            for (let i = 0; i < company[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                company[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              // Check if the fixed time is after now
              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(company[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  company[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            company[z].hotDeals = upcomingDeals;
            // const hours = now.getHours();
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = company[z].startHour.split(":");
            const splitClose = company[z].endHour.split(":");

            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              company[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].avatar;
          obj.id = compCategory[z]._id;
          obj.company = company;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (authHeader && longitude === "" && latitude === "") {
        const myLatitude = 55.7558;
        const myLongitude = 37.6173;
        const token = authHeader.split(" ")[1];
        const user = jwt.decode(token);
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const company = await Company.find({
            owner: { $ne: user.id },
            status: { $eq: 1 },
          })
            .populate("images")
            .populate({
              path: "services",
              populate: { path: "serviceRegister" },
            })
            .populate("phoneNumbers")
            .populate("category")
            .populate({ path: "owner", select: "-password" })
            .populate("likes")
            .populate("hotDeals")
            .populate("comments");
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
          company.forEach((company) => {
            company.kilometr = calculateDistance(
              myLatitude,
              myLongitude,
              company.latitude,
              company.longitude
            );
          });

          company.sort((a, b) => a.kilometr - b.kilometr);

          for (let z = 0; z < company.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = company[z].startHour.split(":");
            const splitClose = company[z].endHour.split(":");
            let upcomingDeals = [];
            for (let i = 0; i < company[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                company[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              // Check if the fixed time is after now
              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(company[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  company[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            company[z].hotDeals = upcomingDeals;
            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              company[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].avatar;
          obj.id = compCategory[z]._id;

          obj.company = company;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (!authHeader && longitude && latitude) {
        const myLatitude = latitude;
        const myLongitude = longitude;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const company = await Company.find({
            status: { $eq: 1 },
          })
            .populate("images")
            .populate({
              path: "services",
              populate: { path: "serviceRegister" },
            })
            .populate("phoneNumbers")
            .populate("hotDeals")
            .populate("category")
            .populate({ path: "owner", select: "-password" })
            .populate("likes")
            .populate("comments");
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
          company.forEach((company) => {
            company.kilometr = calculateDistance(
              myLatitude,
              myLongitude,
              company.latitude,
              company.longitude
            );
          });

          company.sort((a, b) => a.kilometr - b.kilometr);

          for (let z = 0; z < company.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = company[z].startHour.split(":");
            const splitClose = company[z].endHour.split(":");
            let upcomingDeals = [];
            for (let i = 0; i < company[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                company[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(company[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  company[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            company[z].hotDeals = upcomingDeals;
            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              company[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].avatar;
          obj.id = compCategory[z]._id;

          obj.company = company;
          arrResult.push(obj);
        }

        res.status(200).send(arrResult);
      } else if (!authHeader && longitude === "" && latitude === "") {
        const myLatitude = 55.7558;
        const myLongitude = 37.6173;
        const compCategory = await companyCategory.find();
        let arrResult = [];

        for (let z = 0; z < compCategory.length; z++) {
          let obj = {};

          const company = await Company.find({
            status: { $eq: 1 },
          })
            .populate("images")
            .populate({
              path: "services",
              populate: { path: "serviceRegister" },
            })
            .populate("phoneNumbers")
            .populate("category")
            .populate("hotDeals")
            .populate({ path: "owner", select: "-password" })
            .populate("likes")
            .populate("comments");
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
          company.forEach((company) => {
            company.kilometr = calculateDistance(
              myLatitude,
              myLongitude,
              company.latitude,
              company.longitude
            );
          });

          company.sort((a, b) => a.kilometr - b.kilometr);

          for (let z = 0; z < company.length; z++) {
            const hours = moment.tz(process.env.TZ).format("HH:mm");
            const splitOpen = company[z].startHour.split(":");
            const splitClose = company[z].endHour.split(":");
            let upcomingDeals = [];
            for (let i = 0; i < company[z].hotDeals.length; i++) {
              const dealTime = "2024-12-02 15:00";
              const fixedTime = moment.tz(
                company[z].hotDeals[i].date,
                "YYYY-MM-DD HH:mm",
                process.env.TZ
              );


              // Check if the fixed time is after now
              const now = moment.tz(process.env.TZ);
              if (fixedTime.isAfter(now)) {
                upcomingDeals.push(company[z].hotDeals[i]);

              } else {
                await companyHotDeals.findByIdAndUpdate(
                  company[z].hotDeals[i]._id,
                  { $set: { situation: "passed" } }
                );
              }
            }
            company[z].hotDeals = upcomingDeals;
            if (
              Number(hours) >= Number(splitOpen[0]) &&
              Number(hours) < Number(splitClose[0])
            ) {
              company[z].open = true;
            }
          }
          obj.category = compCategory[z].name;
          obj.avatar = compCategory[z].avatar;
          obj.id = compCategory[z]._id;
          obj.company = company;
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
