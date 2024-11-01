import EventService from "../../../services/EventService.js";
import EventCategoryService from "../../../services/EventCategoryService.js";
import companyModel from "../../../models/company/companyModel.js";
import companyCategory from "../../../models/company/companyCategory.js";
import { images } from "mammoth";
import User from "../../../models/User.js";
import meetingModel from "../../../models/meeting/meetingModel.js";
import meetingVerify from "../../../models/meeting/meetingVerify.js";
import companyFavorit from "../../../models/company/companyFavorit.js";
import companyService from "../../../models/company/companyService.js";
import servicesRegistrations from "../../../models/services/servicesRegistrations.js";
import companyComment from "../../../models/company/companyComment.js";
import EventCategory from "../../../models/event/EventCategory.js";
import Event from "../../../models/event/Event.js";
import moment from "moment";
class EventController {
  constructor() {
    this.EventService = new EventService();
    this.EventCategoryService = new EventCategoryService();
  }



  companyShow=async (req,res)=>{
    const event = await companyModel.findById(req.params.id).populate("images").populate("services").populate("phoneNumbers").populate("category").populate("owner").populate("likes").populate("comments");
    // const user=await User.findById(event.owner)
    // console.log("event",event);
    const comments=await companyComment.find({companyId:event._id,userId:event.owner}).populate("userId");
    
    res.render("profile/company-show", {
      layout: "profile",
      title: "Company Show",
      user:req.user,
      event,
      eventCat:event.category,
      // eventCats,
      services:event.services,
      images:event.images,
      phone_numbers:event.phoneNumbers,
      userOwner:event.owner,
      comments :comments,
    });
    // res.render("profile/company-show", {
    //   layout: "profile",
    //   title: "Company View",
    //   user: req.user,
    //   event,
    //   q: req.query,
    // });
  }

  index = async (req, res) => {
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
    let eventCats = await EventCategory.find({status:1}).sort({createdAt: 'desc'}).populate(['owner','name'])
    let events = await this.EventService.get(params);
    function separateUpcomingAndPassed(events) {
      // const now = moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm");
      const upcoming = [];
      const passed = [];

      events.forEach((event) => {
        // const eventDate = new Date(event.date);
        if (event.started_time > moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm")) {
          upcoming.push(event);
        } else {
          passed.push(event);
        }
      });

      return { upcoming, passed };
    }
    const separatedEvents = separateUpcomingAndPassed(events);
    for (let i = 0; i < separatedEvents.passed.length; i++) {
      await Event.findByIdAndUpdate(separatedEvents.passed[i]._id,{$set:{situation:"passed"}})
    }
    let eventsRes = await this.EventService.get(params);
    console.log("eventCats", eventCats);
    
    res.render("profile/event", {
      layout: "profile",
      title: "Event",
      user: req.user,
      events:eventsRes,
      eventCats,
      q: req.query,
    });
  };

  single = async (req, res) => {
    let template = "profile/event-single";
    let event = await this.EventService.getById(req.params.id);
    let eventCats = await this.EventCategoryService.get();
    if (event.status && event.status != 0 && event.status != 1) {
      template += "-rejected";
    }
    console.log("event", event);
    
    res.render(template, {
      layout: "profile",
      title: "Event Single",
      user: req.user,
      event,
      eventCats,
      category:event.category.name
    });
  };

  singleCompany = async (req, res) => {
    let template = "profile/company-single";
    let event = await companyModel.findById(req.params.id).populate("images").populate("services").populate("phoneNumbers");
    const services=await companyService.find({companyId:event._id})
    let registr=0;
    for(let i=0;i<services.length;i++){
      const serviceRegistr=await servicesRegistrations.find({serviceId:services[i]._id})
      registr=registr+serviceRegistr.length
    }
    let eventCat = await companyCategory.findById(event.category);
    const user=await User.findById(event.owner)
    const favorite=await companyFavorit.find({companyId:req.params.id})
    // let eventCats= await companyCategory.find()
    if (event.status && event.status != 0 && event.status != 1) {
      template += "-rejected";
    }
 
   console.log("33333");
   
    // console.log(userOwner,"userOwner");
    
    res.render(template, {
      layout: "profile",
      title: "Company Single",
      user:req.user,
      userOwner:user,
      event,
      eventCat,
      // eventCats,
      services:event.services,
      images:event.images,
      phone_numbers:event.phoneNumbers,
      favorite:favorite.length,
      likes:event.likes.length,
      registr,
      statusMessage:event.rejectMessage
    });
  };

  singleMeeting=async(req,res)=>{
    let template = "profile/meeting-verify-page";
    let meetVerify = await meetingVerify.findById(req.params.id)
    const user=await User.findById(meetVerify.userId)
    if (meetVerify.status && meetVerify.status != 0 && meetVerify.status != 1) {
      template += "-rejected";
    }
 
   
    console.log(user);
    console.log(meetVerify)
    
    res.render(template, {
      layout: "profile",
      title: "Verification",
      user: req.user,
      userMeet: user,
      event:meetVerify,
    });
  }

  edit = async (req, res) => {
    let data = req.body;
    data.status = 1;
    data.tickets_link_active = data.tickets_link_active ? 1 : 0;
    let event = await this.EventService.update(req.params.id, data);
    return res.redirect("back");
  };

  reject = async (req, res) => {
    let status = req.body.status;
    let event = await this.EventService.update(req.params.id, { status });
    return res.redirect("back");
  };

  destroyCompany = async (req, res) => {
    const des_events = req.body.des_events;
    let event = await this.EventService.destroyCompany(des_events);
    return res.redirect("back");
  };
  destroy = async (req, res) => {
    const des_events = req.body.des_events;
    console.log(typeof(des_events));
    
    let event = await this.EventService.destroy(des_events);
    return res.redirect("back");
  };


  destroyImage = async (req, res) => {
    const eventImgId = req.params.id;
    await this.EventService.destroyImage(eventImgId);
    return res.json({ status: "success" });
  };
  destroyCompanyImage = async (req, res) => {
    const eventImgId = req.params.id;
    console.log("eventImgId",eventImgId);
    
    await this.EventService.destroyCompanyImage(eventImgId);
    return res.json({ status: "success" });
  };

  show = async (req, res) => {
    const event = await this.EventService.getById(req.params.id);
    res.render("profile/event-show", {
      layout: "profile",
      title: "Event View",
      user: req.user,
      event,
      q: req.query,
    });
  };
}

export default new EventController();
