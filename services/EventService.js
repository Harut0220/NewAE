import moment from "moment";
import Event from "../models/event/Event.js";
import EventImage from "../models/event/EventImage.js";
import UploadService from "./UploadService.js";
import UserService from "./UserService.js";
import EventDidNotComeUser from "../models/event/EventDidNotComeUser.js";
import NotificationService from "./NotificationService.js";
import notifEvent from "../events/NotificationEvent.js";
import EventImpressionImages from "../models/event/EventImpressionImages.js";
import EventCategoryService from "./EventCategoryService.js";
import companyModel from "../models/company/companyModel.js";
import companyImage from "../models/company/companyImage.js";
import mongoose from "mongoose";
import EventComment from "../models/event/EventComment.js";
import EventCommentLikes from "../models/event/EventCommentLikes.js";
import EventCommentAnswer from "../models/event/EventCommentAnswer.js";
import EventLikes from "../models/event/EventLike.js";
import EventFavorites from "../models/event/EventFavorites.js";
import EventParticipantsSpot from "../models/event/EventParticipantsSpot.js";
import EventViews from "../models/event/EventView.js";
import EventRating from "../models/event/EventRating.js";
import EventParticipants from "../models/event/EventParticipants.js";
import EventAnswerLikes from "../models/event/EventCommentAnswerLike.js";
class EventService {
  constructor() {
    this.UserService = new UserService();
    this.NotificationService = new NotificationService();
    this.EventCategoryService = new EventCategoryService();
  }

  myEvents = async (user_id) => {
    const events = await Event.find({ owner: user_id });

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
    return result;
  };

  getByCollectionId = async (coll_obj) => {
    return await Event.find(coll_obj)
      .sort({ started_time: "desc" })
      .populate([
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        "images",
        "owner",
      ]);
  };

  get = async (params = {}) => {
    let events = Event.find(params);

    // if(params.active){
    //     events = events.or({status:1},{status:2},{status:3},{status:"1"},{status:"2"},{status:"3"});
    // }

    events = events
      .sort({ started_time: "desc" })
      .populate([
        "images",
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
          path: "owner",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
      ])
      .lean();
    return await events;
  };

  find = async (id) => {
    return await Event.findById(id).populate([
      "images",
      {
        path: "category",
        select: {
          name: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          updaedAt: 1,
          avatar: 1,
          map_avatar: 1,
          categoryIcon: "$avatar",
        },
      },
      {
        path: "owner",
        select: ["name", "surname", "email", "phone_number", "avatar"],
      },
      {
        path: "favorites",
        select: ["name", "surname", "email", "phone_number", "avatar"],
      },
      {
        path: "likes",
        select: ["name", "surname", "email", "phone_number", "avatar"],
      },
      // {
      //     path : 'in_place',
      //     select : ['name','surname','email','phone_number','avatar']
      // },
      {
        path: "comments",
        match: {
          parent: null,
        },
        // populate :
        // [
        //     {
        //         path : 'user',
        //         select : ['name','surname','email','phone_number','avatar']

        //     }
        // ]
      },
      "ratings",
      "impression_images",
      {
        path: "participants",
        populate: { path: "user" }[
          ("name", "surname", "email", "phone_number", "avatar")
        ],
      },
      //    {
      //     path : 'in_place',
      //     select : ['name','surname','email','phone_number','avatar']
      //    },
    ]);
  };

  getById = async (id) => {
    return await Event.findById(id)
      .populate([
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        "images",
        "owner",
        "ratings",
        "impression_images",
        "participants",
        "likes",
        "favorites",
        "views",
        {
          path: "comments",
          populate: { path: "user" },
        },
      ])
      .lean();
  };

  store = async (data, userId) => {
    const d = data.body;
    
    
    
    d.owner = userId;

    if (d.latit && d.longit) {

      const pLoc = {
        type: "Point",
        coordinates: [Number(d.latit),Number(d.longit)],
      };

      d.location = pLoc;
      console.log(d.location,"d.location");
    }
    if (d.images && d.images.length) {
      let imgArr = [];
      for (const image of d.images) {
        let img = await EventImage.create({ name: image });
        imgArr.push(img);
      }
      d.images = imgArr;
    }

    const category = await this.EventCategoryService.findById(d.category);
    // if(data.files && data.files.images){
    //     let UploadServ = new UploadService()
    //     d.images = []
    //     for(let i=0;i<data.files.images.length;i++){
    //         let path = UploadServ.store(data.files.images[i],'events')
    //         let img = await EventImage.create({"name":path});
    //         d.images.push(img)
    //     }
    // }
    let event = await Event.create(d);
    const evLink = `alleven://eventDetail/${event._id}`;
    await this.NotificationService.store({
      status: 2,
      date_time: new Date(),
      user: d.owner,
      type: "message",
      message: `Ваше событие ${d.name} находится на модерации`,
      categoryIcon: category.avatar,
      event: event._id,
      link: evLink,
    });
    notifEvent.emit(
      "send",
      d.owner,
      JSON.stringify({
        type: "message",
        date_time: new Date(),
        message: `Ваше событие ${d.name} находится на модерации`,
        categoryIcon: category.avatar,
        link: evLink,
      })
    );

    await this.UserService.pushInCollection(userId, event._id, "events");
    return event;
  };

  pushInCollection = async (event_id, col_id, col_name) => {
    let event = await this.find(event_id);
    event[col_name].push(col_id);
    await event.save();
    return event[col_name];
  };

  destroyFromCollection = async (event_id, col_id, col_name) => {
    let event = await this.find(event_id);
    event[col_name].remove(col_id);
    await event.save();
    return event[col_name];
  };

  checkCollectionData = async (event_id, col_id, col_name) => {
    let event = await Event.findById(event_id);
    return event[col_name].includes(col_id);
  };

  addOrRemoveCollectionData = async (event_id, col_id, col_name) => {
    let checked = await this.checkCollectionData(event_id, col_id, col_name);
    if (checked) {
      await this.UserService.destroyFromCollection(
        col_id,
        event_id,
        "event_" + col_name
      );
      return await this.destroyFromCollection(event_id, col_id, col_name);
    } else {
      await this.UserService.pushInCollection(
        col_id,
        event_id,
        "event_" + col_name
      );
      return await this.pushInCollection(event_id, col_id, col_name);
    }
  };

  existsReturnCreated = async (event_id, col_id, col_name) => {
    let checked = await this.checkCollectionData(event_id, col_id, col_name);
    if (checked) {
      return 0;
    }

    return await this.pushInCollection(event_id, col_id, col_name);
  };

  update = async (id, data) => {
    let event = await this.find(id);
    if (!event) {
      return 0;
    }
    if (data.latit && data.longit) {
      const pLoc = {
        type: "Point",
        coordinates: [data.latit, data.longit],
      };
      data.location = pLoc;
    }
    const evLink = `alleven://eventDetail/${event._id}`;

    if (data.status && data.status != "0" && event.owner) {
      let eventDate = new Date(event.started_time)
        .toLocaleDateString()
        .slice(0, 10);
      let nowDate = new Date().toLocaleDateString().slice(0, 10);

      if (nowDate == eventDate) {
        data.situation = "upcoming";
      }

      let msg =
        data.status == 1
          ? `Ваше событие ${event.category.name} ${event.name} одобрено модератором. Теперь оно на карте города`
          : `К сожалению, ваше событие ${event.category.name} ${event.name} отклонено модератором, причина - ${data.status}`;
      await this.NotificationService.store({
        status: 2,
        date_time: new Date(),
        user: event.owner._id,
        type: "message",
        message: msg,
        link: evLink,
        categoryIcon: event.category.avatar,
        event: event._id,
      });
      notifEvent.emit(
        "send",
        event.owner._id.toString(),
        JSON.stringify({
          type: "message",
          date_time: new Date(),
          message: msg,
          link: evLink,
          categoryIcon: event.category.avatar,
        })
      );
    } else if (data.status == "0" && event.owner) {
      await this.NotificationService.store({
        status: 2,
        date_time: new Date(),
        user: event.owner._id,
        type: "message",
        message: `Ваше событие ${event.category.name} ${event.name} находится на модерации`,
        link: evLink,
        categoryIcon: event.category.avatar,
        event: event._id,
      });
      notifEvent.emit(
        "send",
        event.owner._id.toString(),
        JSON.stringify({
          type: "message",
          date_time: new Date(),
          message: `Ваше событие ${event.category.name} ${event.name} находится на модерации`,
          link: evLink,
          categoryIcon: event.category.avatar,
        })
      );
      notifEvent.emit(
        "send",
        "ADMIN",
        JSON.stringify({
          type: "Событие находится на модерации",
          message: event.name,
          data: event,
          link: evLink,
          categoryIcon: event.category.avatar,
        })
      );
    }

    await event.updateOne(data);
    return event;
  };

  isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
  };

  getByDate = async (date_from, date_to) => {
    const dateFrom = new Date(date_from);
    const dateTo = new Date(date_to);

    if (!this.isValidDate(dateFrom) && !this.isValidDate(date_to)) {
      return 0;
    }
    const events = await Event.find({
      createdAt: {
        $gte: new Date(date_from).toISOString(),
        $lte: new Date(date_to).toISOString(),
      },
    }).count();

    return events;
  };

  findManyById = async (IDs) => {
    // console.log(IDs)
    return Event.find({ _id: IDs });
  };

  destroy = async (des_events) => {

    setTimeout(async () => {
      
   
    if (Array.isArray(des_events)) {
      for (let i = 0; i < des_events.length; i++) {
        const event = await Event.findById(des_events[i]);

        if (!event) {
          throw new Error("Event not found");
        }

        // Find all related comments
        const comments = await EventComment.find({
          event: des_events[i],
        });

        // For each comment, delete related answers and likes
        for (const comment of comments) {
          // Delete all likes related to the comment
          await EventCommentLikes.deleteMany({ commentId: comment._id });

          // Find all answers related to the comment
          const answers = await EventCommentAnswer.find({
            commentId: comment._id,
          });

          // For each answer, delete related likes
          for (const answer of answers) {
            await EventAnswerLikes.deleteMany({ answerId: answer._id });
          }

          // Delete all answers related to the comment
          await EventCommentAnswer.deleteMany({ commentId: comment._id });
        }

        // Delete all comments related to the meeting
        await EventComment.deleteMany({ meetingId: des_events[i] });
        await EventImage.deleteMany({ meetingId: des_events[i] });
        await EventLikes.deleteMany({ meetingId: des_events[i] });
        await EventFavorites.deleteMany({ meetingId: des_events[i] });
        await EventParticipantsSpot.deleteMany({ meetingId: des_events[i] });
        await EventViews.deleteMany({ meetingId: des_events[i] });
        await EventRating.deleteMany({ meetingId: des_events[i] });
        await EventParticipants.deleteMany({ meetingId: des_events[i] });

        await event.remove();
        console.log("Meetings and all related data deleted successfully");
      }
    }
    if (typeof des_events === "string") {
      const event = await Event.findById(des_events);

      if (!event) {
        throw new Error("Meeting not found");
      }

      // Find all related comments
      const comments = await EventComment.find({ meetingId: des_events });

      // For each comment, delete related answers and likes
      for (const comment of comments) {
        // Delete all likes related to the comment
        await EventCommentLikes.deleteMany({ commentId: comment._id });

        // Find all answers related to the comment
        const answers = await EventCommentAnswer.find({
          commentId: comment._id,
        });

        // For each answer, delete related likes
        for (const answer of answers) {
          await EventAnswerLikes.deleteMany({ answerId: answer._id });
        }

        // Delete all answers related to the comment
        await EventCommentAnswer.deleteMany({ commentId: comment._id });
      }

      // Delete all comments related to the meeting
      await EventComment.deleteMany({ meetingId: des_events });
      await EventImage.deleteMany({ meetingId: des_events });
      await EventLikes.deleteMany({ meetingId: des_events });
      await EventFavorites.deleteMany({ meetingId: des_events });
      await EventParticipantsSpot.deleteMany({ meetingId: des_events });
      await EventViews.deleteMany({ meetingId: des_events });
      await EventRating.deleteMany({ meetingId: des_events });
      await EventParticipants.deleteMany({ meetingId: des_events });

      await event.remove();

      console.log("Meeting and all related data deleted successfully");
    }
  },2000)

    console.log("successfully deleted");
    
    return { message: "success" };
  };
  destroyCompany = async (des_events) => {
    if (Array.isArray(des_events)) {
      for (let i = 0; i < des_events.length; i++) {
        const event = await Event.findById(des_events[i]);

        if (!event) {
          throw new Error("Event not found");
        }

        // Find all related comments
        const comments = await EventComment.find({
          event: des_events[i],
        });

        // For each comment, delete related answers and likes
        for (const comment of comments) {
          // Delete all likes related to the comment
          await EventCommentLikes.deleteMany({ commentId: comment._id });

          // Find all answers related to the comment
          const answers = await EventCommentAnswer.find({
            commentId: comment._id,
          });

          // For each answer, delete related likes
          for (const answer of answers) {
            await EventAnswerLikes.deleteMany({ answerId: answer._id });
          }

          // Delete all answers related to the comment
          await EventCommentAnswer.deleteMany({ commentId: comment._id });
        }

        // Delete all comments related to the meeting
        await EventComment.deleteMany({ meetingId: des_events[i] });
        await EventImage.deleteMany({ meetingId: des_events[i] });
        await EventLikes.deleteMany({ meetingId: des_events[i] });
        await EventFavorites.deleteMany({ meetingId: des_events[i] });
        await EventParticipantsSpot.deleteMany({ meetingId: des_events[i] });
        await EventViews.deleteMany({ meetingId: des_events[i] });
        await EventRating.deleteMany({ meetingId: des_events[i] });
        await EventParticipants.deleteMany({ meetingId: des_events[i] });

        await event.remove();
        console.log("Meetings and all related data deleted successfully");
      }
    }
    if (typeof des_events === "string") {
      const event = await Event.findById(des_events);

      if (!event) {
        throw new Error("Meeting not found");
      }

      // Find all related comments
      const comments = await EventComment.find({ meetingId: des_events });

      // For each comment, delete related answers and likes
      for (const comment of comments) {
        // Delete all likes related to the comment
        await EventCommentLikes.deleteMany({ commentId: comment._id });

        // Find all answers related to the comment
        const answers = await EventCommentAnswer.find({
          commentId: comment._id,
        });

        // For each answer, delete related likes
        for (const answer of answers) {
          await EventAnswerLikes.deleteMany({ answerId: answer._id });
        }

        // Delete all answers related to the comment
        await EventCommentAnswer.deleteMany({ commentId: comment._id });
      }

      // Delete all comments related to the meeting
      await EventComment.deleteMany({ meetingId: des_events });
      await EventImage.deleteMany({ meetingId: des_events });
      await EventLikes.deleteMany({ meetingId: des_events });
      await EventFavorites.deleteMany({ meetingId: des_events });
      await EventParticipantsSpot.deleteMany({ meetingId: des_events });
      await EventViews.deleteMany({ meetingId: des_events });
      await EventRating.deleteMany({ meetingId: des_events });
      await EventParticipants.deleteMany({ meetingId: des_events });

      await event.remove();

      console.log("Meeting and all related data deleted successfully");
    }
    return { message: "success" };
    return { message: "success" };
  };

  nearEvent = async (data) => {
    const user = await this.UserService.find(data.user_id);
    if (
      user.roles.name == "USER" &&
      user.event_favorite_categories &&
      user.event_favorite_categories.length
    ) {
      const categories = [];

      for (let fc = 0; fc < user.event_favorite_categories.length; fc++) {
        categories.push(user.event_favorite_categories[fc]._id.toString());
      }

      var events = Event.find({
        category: { $in: categories },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [data.latitude, data.longitude],
            },
            $maxDistance: 10000,
          },
        },
        $or: [{ status: 1 }, { status: 2 }, { status: 3 }],
      }).sort({ started_time: "desc" });
    } else {
      var events = Event.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [data.latitude, data.longitude],
            },
            $maxDistance: 10000,
          },
        },
        $or: [{ status: 1 }, { status: 2 }, { status: 3 }],
      }).sort({ started_time: "desc" });
    }

    events
      .populate([
        "images",
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
          path: "owner",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
        {
          path: "favorites",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
        {
          path: "likes",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
      ])
      .lean();

    return await events;
  };

  changeSituation = async () => {
    const events = await Event.find({})
      .populate([
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
          path: "participants",
          populate: { path: "userId", populate: "roles" },
        },
        // {
        //     path : 'in_place',
        //     populate  : 'roles'

        // },
      ])
      .lean();
      console.log("notif change situation", events);
      
    const nowDate = new Date();
    const nowMonth = nowDate.getMonth();
    const nowDay = nowDate.getDate();
    const nowYear = nowDate.getFullYear();

    // console.log(month,day,year)

    for (let e = 0; e < events.length; e++) {
      let situation = "upcoming";
      let eventDate = new Date(events[e].started_time);
      let eventMonth = eventDate.getMonth();
      let eventDay = eventDate.getDate();
      let eventYear = eventDate.getFullYear();
      let eventMinute = eventDate.getMinutes();
      let eventSecunde = eventDate.getSeconds();

      if (nowYear == eventYear && nowMonth == eventMonth) {
        if (nowDay == eventDay - 1) {
          for (let v = 0; v < events[e].participants.length; v++) {
            if (
              (events[e].participants[v].userId.roles.name = "USER" && !events[e].end)
            ) {
              let ev_st_time = new Date(events[e].started_time);
              ev_st_time.setHours(+ev_st_time.getHours() - 1);
              const evLink = `alleven://eventDetail/${events[e]._id}`;
              //await this.NotificationService.store({status:2,date_time:nowDate,user:events[e].visits[v],type:'confirm_come',event:events[e]._id,message:`Событие ${events[e].name}, начнется «${eventYear}-${eventMonth}-${eventDay}» в «${eventMinute}:${eventSecunde}», не опоздайте`});
              //notifEvent.emit('send',events[e].visits[v],JSON.stringify({status:2,date_time:nowDate,user:events[e].visits[v],type:'confirm_come',event:events[e]._id,message:`Событие ${events[e].name}, начнется «${eventYear}-${eventMonth}-${eventDay}» в «${eventMinute}:${eventSecunde}», не опоздайте`}));
              // await this.NotificationService.store({status:1,date_time:ev_st_time,user:events[e].visits[v],type:'confirm_come',event:events[e]._id,message:`Событие ${events[e].name}, начнется «${eventYear}-${eventMonth}-${eventDay}» в «${eventMinute}:${eventSecunde}», не опоздайте`,notif_type:'Событие началось'});
              await this.NotificationService.store({
                status: 1,
                link: evLink,
                date_time: ev_st_time,
                user: events[e].participants[v],
                type: "confirm_come",
                event: events[e]._id,
                message: `Событие ${events[e].name}, начнется через 1 час. Если вы пойдете, не забудьте поделиться впечатлениями!`,
                notif_type: "Событие началось",
                categoryIcon: events[e].category.avatar,
                event: events[e]._id,
              });
            }
          }
        }

        if (nowDay == eventDay) {
          situation = "upcoming";
        } else if (nowDay > eventDay) {
          let evn = await this.find(events[e]._id);
          evn.status = 3;
          await evn.save();

          situation = "passed";

          for (let p = 0; p < events[e].participantsSpot.length; p++) {
            let evnt = await this.find(events[e]._id);
            evnt.end = true;
            await evnt.save();

            // console.log(events[e].visits[p])

            // if(events[e].visits.length && events[e].visits[p].roles && events[e].visits[p].roles.name == 'VISITOR' && !events[e].end){
            // let msg = `Оцените прошедшее событие ${events[e].name}`;
            // await this.NotificationService.store({type:'message',date_time:new Date(),status:2,message:msg,user:events[e].visits[p]._id.toString(),event_situation:'passed'});
            // notifEvent.emit('send',events[e].visits[p]._id.toString(),JSON.stringify({status:2,date_time:nowDate,type:'message',message:msg,event_situation:'passed'}));

            // let evnt = await this.find(events[e]._id);
            // evnt.end = true;
            // await evnt.save()
            // }
          }
        }
      } else if (eventDate.getTime() < nowDate.getTime()) {
        situation = "passed";
      }
      let ev = await this.find(events[e]._id);
      ev.situation = situation;
      await ev.save();
    }
  };

  storeDidNotCome = async (data) => {
    return EventDidNotComeUser.create(data);
  };

  findAndLean = async (id) => {
    return await Event.findById(id)
      .populate([
        "images",
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
          path: "owner",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
        {
          path: "favorites",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
        {
          path: "likes",
          select: ["name", "surname", "email", "phone_number", "avatar"],
        },
        {
          path: "comments",
          match: {
            parent: null,
          },
          // populate :
          // [
          //     {
          //         path : 'user',
          //         select : ['name','surname','email','phone_number','avatar']

          //     }
          // ]
        },
        "ratings",
        "impression_images",
        "participants",
        //   {
        //     path : 'in_place',
        //     select : ['name','surname','email','phone_number','avatar']
        //   },
      ])
      .lean();
  };

  destroyImage = async (id) => {
    return await EventImage.findByIdAndDelete(id);
  };
  destroyCompanyImage = async (id) => {
    const dbCompanyImage = await companyImage.findById(id);
    const dbCompany = await companyModel(dbCompanyImage.companyId);
    let index = dbCompany.images.indexOf(id);
    let res;
    if (index !== -1) {
      res = dbCompany.images.splice(index, 1); // Remove 1 element at index position
    }
    dbCompany.images = res;
    await dbCompany.save();
    return await companyImage.findByIdAndDelete(id);
  };

  destroyByUserId = async (user_id) => {
    return await Event.deleteMany({ owner: user_id });
  };

  sendEventNotif = async () => {
    const events = await Event.find({})
      .populate([
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
            path : 'participants',
            populate  : {path:"userId",populate:"roles"}

        },
        // {
        //     path : 'in_place',
        //     populate  : 'roles'

        // },
      ])
      .lean();

    for (let e = 0; e < events.length; e++) {
      let isTodayAndLessOneHours = await this.isTodayAndLessOneHours(
        events[e].started_time
      );
      let isTodayAndMoreHours = await this.isTodayAndLessMoreHours(
        events[e].started_time
      );
      let isTodayNow = await this.isToday(events[e].started_time);

      if (isTodayAndLessOneHours) {
        for (let v = 0; v < events[e].participants.length; v++) {
          if (
            (events[e].participants[v].userId.roles.name = "USER" && !events[e].end)
          ) {
            let ev_st_time = new Date(events[e].started_time);
            const evLink = `alleven://eventDetail/${events[e]._id}`;
            notifEvent.emit(
              "send",
              events[e].participants[v],
              JSON.stringify({
                link: evLink,
                status: 2,
                date_time: ev_st_time,
                user: events[e].participants[v],
                type: "confirm_come",
                event: events[e]._id,
                message: `Событие ${events[e].name}, начнется через 1 час. Если вы пойдете, не забудьте поделиться впечатлениями!`,
                categoryIcon: events[e].category.avatar,
                event: events[e]._id,
              })
            );
            await this.NotificationService.store({
              status: 2,
              date_time: ev_st_time,
              user: events[e].participants[v],
              type: "confirm_come",
              event: events[e]._id,
              message: `Событие ${events[e].name}, начнется через 1 час. Если вы пойдете, не забудьте поделиться впечатлениями!`,
              notif_type: "Событие началось",
              categoryIcon: events[e].category.avatar,
              link: evLink,
            });
          }
        }
      } else if (isTodayNow) {
        // for(let v=0;v<events[e].visits.length;v++){
        //     if(events[e].visits[v].roles.name = 'VISITOR' && !events[e].end){
        //         await this.NotificationService.store({status:2,date_time:new Date().toLocaleString(),user:events[e].visits[v],type:'confirm_come',event:events[e]._id,message:`Пожалуйста, подтвердите, что вы придете на ${events[e].name}`, categoryIcon: events[e].category.avatar, event: events[e]._id});
        //         notifEvent.emit('send',events[e].visits[v],JSON.stringify({status:2,date_time:new Date().toLocaleString(),user:events[e].visits[v],type:'confirm_come',event:events[e]._id,message:`Пожалуйста, подтвердите, что вы придете на ${events[e].name}`, categoryIcon: events[e].category.avatar}));
        //     }
        // }
      } else if (isTodayAndMoreHours) {
        for (let p = 0; p < events[e].participantsSpot.length; p++) {
          if (
            events[e].participantsSpot.length &&
            events[e].participantsSpot[p].roles &&
            events[e].participantsSpot[p].roles.name == "USER" &&
            !events[e].end
          ) {
            let msg = `Оцените прошедшее событие ${events[e].name}`;
            const evLink = `alleven://eventDetail/${events[e]._id}`;
            await this.NotificationService.store({
              type: "message",
              link: evLink,
              date_time: new Date().toLocaleString(),
              status: 2,
              message: msg,
              user: events[e].visits[p]._id.toString(),
              event_situation: "passed",
              categoryIcon: events[e].category.avatar,
              event: events[e]._id,
            });
            notifEvent.emit(
              "send",
              events[e].visits[p]._id.toString(),
              JSON.stringify({
                link: evLink,
                status: 2,
                date_time: new Date().toLocaleString(),
                type: "message",
                message: msg,
                event_situation: "passed",
                categoryIcon: events[e].category.avatar,
              })
            );
          }
        }
      }
    }
  };

  isTodayAndLessOneHours = async (date) => {
    const now = new Date();
    date = new Date(date);

    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear() &&
      date.getHours() - 1 == now.getHours()
    );
  };

  isTodayAndLessMoreHours = async (date) => {
    const now = new Date();
    date = new Date(date);

    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear() &&
      date.getHours() + 3 == now.getHours()
    );
  };

  isToday = async (date) => {
    const now = new Date();
    date = new Date(date);

    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear() &&
      date.getHours() == now.getHours()
    );
  };

  findOwnerImpressions = async (userId) => {
    const eventIds = await Event.find({
      owner: userId,
      status: 1,
    }).distinct("_id");

    const impressionsIds = await EventImpressionImages.find({
      event: {
        $in: eventIds,
      },
    }).distinct("event");

    return await Event.find({
      _id: { $in: impressionsIds },
    })
      .sort({ started_time: "desc" })
      .populate({
        path: "impression_images",
        select: { images: "$path" },
      })
      .populate([
        "images",
        {
          path: "owner",
          select: ["_id", "avatar", "email", "name", "surname", "phone_number"],
        },
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
      ]);
  };

  findVisitorImpressions = async (userId) => {
    const impressionsIds = await EventImpressionImages.find({
      user: userId,
    }).distinct("event");
    return await Event.find({
      _id: { $in: impressionsIds },
      status: 1,
    })
      .sort({ started_time: "desc" })
      .populate([
        "images",
        {
          path: "impression_images",
          select: { images: "$path" },
        },
        {
          path: "category",
          select: {
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updaedAt: 1,
            avatar: 1,
            map_avatar: 1,
            categoryIcon: "$avatar",
          },
        },
        {
          path: "owner",
          select: ["_id", "avatar", "email", "name", "surname", "phone_number"],
        },
      ]);
  };

  sendCreateEventNotif = async () => {
    const organizers = await this.UserService.getUsersForLastEvent(["USER"]);
    for (const organizer of organizers) {
      if (organizer.last_event_date) {
        const lastDate = moment(organizer.last_event_date, "YYYY-MM-DDTHH:mm");
        const dateNow = moment();
        const difference = dateNow.diff(lastDate);
        const differenceInHours = Math.round(
          moment.duration(difference).asHours()
        );
        if (differenceInHours == 48) {
          const link = `alleven://create`;
          await this.NotificationService.store({
            status: 2,
            date_time: new Date(),
            user: organizer._id,
            type: "create_new",
            message: `Разместите информацию о вашем будущем событии.`,
            link,
          });
          notifEvent.emit(
            "send",
            organizer._id.toString(),
            JSON.stringify({
              type: "create_new",
              date_time: new Date(),
              message: `Разместите информацию о вашем будущем событии.`,
              link,
            })
          );
        }
      }
    }
    return 1;
  };
}

export default EventService;
