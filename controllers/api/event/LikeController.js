import EventService from "../../../services/EventService.js";
import notifEvent from "../../../events/NotificationEvent.js";
import NotificationService from "../../../services/NotificationService.js";
import EventLike from "../../../models/event/EventLike.js";
import Event from "../../../models/event/Event.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import Notification from "../../../models/Notification.js";

class LikeController {
  constructor() {
    this.EventService = new EventService();
    this.NotificationService = new NotificationService();
  }

  index = async (req, res) => {
    let datas = await this.EventService.getByCollectionId({
      likes: req.user.id,
    });
    return res.json({ status: "success", data: datas });
  };

  // store = async (req,res) => {
  //     const {event_id} = req.body;
  //     const event = await this.EventService.find(event_id);
  //     const userName = req.user.name ? req.user.name : '';
  //     const userSurname = req.user.surname ? req.user.surname : '';

  //     let evEx = 0;

  //     for(let e =0;e<event.likes.length;e++){
  //         if(event.likes[e]._id == req.user.id){
  //             evEx = 1;
  //         }
  //     }

  //     if(!evEx && event.owner){
  //         const evLink = `alleven://eventDetail/${event._id}`;
  //         const msg = `${userName} ${userSurname} нравится ваше событие ${event.name}`;
  //         const notif = await this.NotificationService.store({type:'message',date_time:new Date(),status:2,message:msg,user:event.owner._id.toString(),link:evLink,notif_type:'Лайк', categoryIcon: event.category.avatar, event: event._id})
  //         notifEvent.emit('send',event.owner._id.toString(),JSON.stringify({type:'message',date_time:new Date(),message:msg,link:evLink,notif_type:'Лайк', categoryIcon: event.category.avatar}));
  //     }

  //     let ev = await this.EventService.addOrRemoveCollectionData(event_id,req.user.id,'likes');

  //     return res.json({'status':'success'})
  // }

  like = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const user = jwt.decode(token);
    const { id } = req.body;
    if (id) {
      const neLike = await EventLike.findOne({ user: user.id, eventId: id });
      if (!neLike) {
        const like = await EventLike.create({
          user: user.id,
          eventId: id,
          date: moment.tz(process.env.TZ).format(),
        });
        const event = await Event.findByIdAndUpdate(
          id,
          { $push: { likes: like._id } },
          { new: true }
        )
          .populate({ path: "owner", select: "_id notifEvent" })
          .populate("category");
          const evLink = `alleven://eventDetail/${event_id}`;
          const dataNotif = {
            status: 2,
            date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
            user: event.owner._id.toString(),
            type: "like",
            message: `Пользователь ${user.name} поставил лайк событию ${event.name}.`,
            event: event._id,
            link: evLink,
          };
          const nt = new Notification(dataNotif);
          await nt.save();
        if (event.owner.notifEvent) {

          notifEvent.emit(
            "send",
            event.owner._id.toString(),
            JSON.stringify({
              type: "like",
              date_time: moment.tz(process.env.TZ).format("YYYY-MM-DD HH:mm"),
              message: `Пользователь ${user.name} поставил лайк событию ${event.name}.`,
              categoryIcon: event.category.avatar,
              link: evLink,
            })
          );
        }
        return res.json({ status: "success", message: "liked" });
      } else {
        await EventLike.findByIdAndDelete(neLike._id);
        await Event.findByIdAndUpdate(id, { $pull: { likes: neLike._id } });
        return res.json({ status: "success", message: "deleted" });
      }
    } else {
      return res.json({ status: "ERROR", message: "Event id is required" });
    }

   
  };
}

export default new LikeController();
