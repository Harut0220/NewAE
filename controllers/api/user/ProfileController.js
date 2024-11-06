import UserService from "../../../services/UserService.js";
import NodeCache from "node-cache";
import GenerateRand from "../../../services/GenerateRand.js";
import SmsProstoService from "../../../services/SmsProstoService.js";
import NotificationListService from "../../../services/NotificationListService.js";
import EventService from "../../../services/EventService.js";
import AccessTokenService from "../../../services/AccessTokenService.js";
import User from "../../../models/User.js";
import jwt  from "jsonwebtoken";
import meetingModel from "../../../models/meeting/meetingModel.js";
import Notification from "../../../models/Notification.js";
import companyModel from "../../../models/company/companyModel.js";
const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

class ProfileController{

    constructor(){
        this.UserService = new UserService() 
        this.SmsProstoService = new SmsProstoService()
        this.GenerateRand = new GenerateRand()
        this.NotificationListService = new NotificationListService()
        this.EventService = new EventService()
        this.AccessTokenService = new AccessTokenService()
    }

    index = async (req,res) => {
    const authHeader = req.headers.authorization;

     const token = authHeader.split(' ')[1];

      const user = jwt.decode(token);
        console.log(authHeader,"authHeader");
        
       let u = await User.findById(user.id).populate("roles")
        if (u) {
            return res.status(200).send({success:true,"data":u})
        }else{
            return res.status(403).send({success:false,"message":"User not found"})
        }
        // const user1 = await this.UserService.findAndLean(user.id);

        // user1.unread_notifications = await this.UserService.getCountNotif(user._id)
        
    }

    update = async (req,res) => {
        const authHeader = req.headers.authorization;
        const token1 = authHeader.split(' ')[1];
        const user1 = jwt.decode(token1);
        console.log("authHeader",authHeader);
        
        const user = await this.UserService.update(user1.id,req.body);
        const token = await this.AccessTokenService.jwtSignByPhone(user.phone_number);
        return res.json({"status":"success","message":"Updated successfully",user,token})
    }

    updateAvatar = async (req,res) => {
        let user = await this.UserService.updateAvatar(req.user.id,req.files.avatar);
        const token = await this.AccessTokenService.jwtSignByPhone(user.phone_number);
        return res.json({"status":"success","data":user,token}) 
    }

    destroy = async (req,res) => {
        const authHeader = req.headers.authorization;
        const token1 = authHeader.split(' ')[1];
        const user1 = jwt.decode(token1);
        console.log("authHeader",authHeader);
        await this.UserService.destroy(user1.id);
        await this.EventService.destroyByUserId(user1.id);
        await meetingModel.deleteMany({userId:user1.id});
        await companyModel.deleteMany({owner:user1.id});
        await Notification.deleteMany({user:user1.id});
        return res.json({"status":"success","message":"User succesfuly deleted"})
    }

    updatePhoneNumber = async (req,res) => {
        console.log('updatePhoneNumber')
        const { phone_number } = req.body;
        const exUser = await this.UserService.findByPhoneNumber(phone_number);
        if(exUser){
            res.status(400);
            return res.json({satatus:false,message:'Номер телефона уже используется'})
        }
        const rand = await this.GenerateRand.pin();
        const sms = await this.SmsProstoService.sendMessage(phone_number,rand);
        if(sms != "0"){
          res.status(400);
          return res.json({satatus:false,message:'Неверный формат номер телефона'})  
        }
        myCache.set(`update_phone_number_${req.user.id}`, `${rand}_${phone_number}`, 54000 )
        return res.json({satatus:'success',message:'Проверьте свой телефон, через 15 минут код исчезнет'});
    }

    updatePhoneNumberConfirm = async (req,res) => {
        const { phone_number_code } = req.body;

        const ph_num_c = myCache.get(`update_phone_number_${req.user.id}`);
        if(!ph_num_c){
            return res.json({'status':'fail','message':'15-минутный лимит исчерпан, попробуйте еще раз'});
        }
        const data = ph_num_c.split("_")
            
        if(data[0] != phone_number_code){
            return res.json({'status':'fail','message':'Неверный код'})
        }
        
        const nUser = await this.UserService.update(req.user.id,{phone_number:data[1]})
        const token = await this.AccessTokenService.jwtSignByPhone(nUser.phone_number);

        return res.json({'status':'success','message':'Номер телефона успешно обновлен',token})

    }

    storeFavoriteCategory = async (req,res) => {
        const category = req.body.event_category_id;
        const data = await this.UserService.pushInCollection(req.user.id,category,'event_favorite_categories');
        return res.json({'message':'success'})
    }

    destroyFavoriteCategory = async (req,res) => {
        const category = req.body.event_category_id;
        const data = await this.UserService.destroyFromCollection(req.user.id,category,'event_favorite_categories');
        return res.json({'message':'success'})
    } 
    
    getFavoriteCategory = async (req,res) => {
        console.log('authenticateJWT: ', req.body);
        const authHeader = req.headers.authorization;
        if(authHeader&&authHeader!=="null"){
            console.log(authHeader,"authHeader");
            const token = authHeader.split(' ')[1];
       
             const user = jwt.decode(token);
              console.log(user,"user");
              console.log(user.id,"user._id");
           const data = await this.UserService.getSpecCol(user.id,'event_favorite_categories');
           if(data){
               return res.status(200).json({'message':'success',data:data.event_favorite_categories})
   
           }else{
               return res.status(403).json({'message':'success',data:[]})
           }
        }else{
            return res.status(403).json({'message':'Unauthorized'})
        }


    }

    getNotification = async (req,res) => {
        // const data = await this.NotificationListService.get();
        console.log('authenticateJWT: ', req.body);
        const authHeader = req.headers.authorization;
        if(authHeader && authHeader !== 'null') {
            console.log(authHeader,"authHeader");
            const token = authHeader.split(' ')[1];
       
             const user = jwt.decode(token);
              console.log(user,"user");
              console.log(user.id,"user._id");
              const data = await this.NotificationListService.getByRole(user.role);
              console.log(data,"data");   
           
              
               const userNotificationList = await this.UserService.getSpecCol(user.id,'list_of_notifications');
               if(userNotificationList){
               for(let d=0;d<data.length;d++){
                   for(let c=0;c<userNotificationList.list_of_notifications.length;c++){
                       if(data[d]._id == userNotificationList.list_of_notifications[c]._id.toString()){
                           data[d].confirmed = true
                       }
                   }
                   if(!userNotificationList.list_of_notifications.length){
                       data[d].confirmed = false
                   }
               }
       
               return res.status(200).send({success:true,data})
              }else{
               return res.status(403).send({success:true,data:[]})
              }
        }else{
            return res.status(403).send({message:"Unauthorized"})
        }


    }
    
    storeNotification = async (req,res) => {
        const notification = req.body.notifications_list_id;
        const data = await this.UserService.pushInCollection(req.user.id,notification,'list_of_notifications');
        return res.json({'message':'success'})
    }
    
    destroyNotification = async (req,res) => {
        const notification = req.body.notifications_list_id;
        const data = await this.UserService.destroyFromCollection(req.user.id,notification,'list_of_notifications');
        return res.json({'message':'success'})
    }

    userEdit=async(req,res)=>{
   try {
    const authHeader = req.headers.authorization;
    console.log(authHeader, "authHeader");
    const token = authHeader.split(" ")[1];

    const user = jwt.decode(token);
    const {name,path}=req.body
    // const user={id:"656ecb2e923c5a66768f4cd4"}
    const result=await User.findById(user.id)
    if(path&&name&&path!=="null"&&name!=="null"){
        const names=name.split(" ")
        result.name=names[0]
        result.surname=names[1]
        result.avatar=path
        await result.save()
        return res.status(200).send({message:"success"})

    }else{
        if(name&&name!=="null"){
            const names=name.split(" ")
            result.name=names[0]
            result.surname=names[1]
            await result.save()
            return res.status(200).send({message:"success"})

        }else if(path&&path!=="null"){
            result.avatar=path
            await result.save()
            return res.status(200).send({message:"success"})
        }else{
            return res.status(400).send({message:"wrong data"})
        }
    }
   } catch (error) {
    console.error(error)
    return res.status(400).send({message:"wrong data"})

   }

    }

}

export default new ProfileController();