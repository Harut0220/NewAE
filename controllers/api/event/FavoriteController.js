import EventService from "../../../services/EventService.js";
import notifEvent from "../../../events/NotificationEvent.js";
import NotificationService from "../../../services/NotificationService.js";
import EventFavorites from "../../../models/event/EventFavorites.js";
import Event from "../../../models/event/Event.js";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
class FavoriteController{
    constructor(){
        this.EventService = new EventService()
        this.NotificationService = new NotificationService()
    }

    index = async (req,res) => {

        let datas = await this.EventService.getByCollectionId({'favorites':req.user.id})
        return res.json({'status':'success','data':datas})
    }

    store = async (req,res) => {
        const {event_id} = req.body;
        const event = await this.EventService.find(event_id);
        let evEx = 0;

        for(let e =0;e<event.favorites.length;e++){
            if(event.favorites[e]._id == req.user.id){
                evEx = 1;
            }
        }

        const userName = req.user.name ? req.user.name : '';
        const userSurname = req.user.surname ? req.user.surname : '';

        if(!evEx && event.owner){
            const evLink = `alleven://eventDetail/${event._id}`
            const msg = `Пользователь ${userName} ${userSurname} добавил в «избранное» ваше событие ${event.name}`;
            const notif = await this.NotificationService.store({type:'message',date_time:new Date(),status:2,message:msg,user:event.owner._id.toString(),link:evLink,notif_type:'Добавлено в избранное', categoryIcon: event.category.avatar, event: event._id})
            notifEvent.emit('send',event.owner._id.toString(),JSON.stringify({type:'message',date_time:new Date(),message:msg,link:evLink,notif_type:'Добавлено в избранное', categoryIcon: event.category.avatar}));
        }

        let ev = await this.EventService.addOrRemoveCollectionData(event_id,req.user.id,'favorites')
        return res.json({'status':'success'})
    }

    favorite = async (req,res) => {
        const authHeader = req.headers.authorization;
        // if(authHeader&&authHeader!=="null"){
            const token = authHeader.split(" ")[1];
        
            const user = jwt.decode(token);
            // const user={id:"656ecb2e923c5a66768f4cd3"}
            const {id} = req.body;
            if(id){
                const isFavorite=await EventFavorites.findOne({userId:user.id,eventId:id})
                if(isFavorite){
                    
                    await Event.findByIdAndUpdate(id,{$pull:{favorites:isFavorite._id}})
                    await User.findByIdAndUpdate(user.id,{$pull:{event_favorites:id}})
                   await EventFavorites.findByIdAndDelete(isFavorite._id)
                    return res.json({'status':'success',"message":"remove favorite"})
                }else {
                    const favorite=new EventFavorites({
                        userId:user.id,
                        eventId:id
                    })
                    await favorite.save()
                    await User.findByIdAndUpdate(user.id,{$push:{event_favorites:id}})
                    await Event.findByIdAndUpdate(id,{$push:{favorites:favorite._id}})
                    
                    return res.json({'status':'success',"message":"add favorite"})
                }
            }else{
                return res.json({'status':'error',"message":"error"})
            }
        // }else{
        //     return res.json({'status':'error',"message":"Unauthorized"})
        // }





    }

}

export default new FavoriteController();