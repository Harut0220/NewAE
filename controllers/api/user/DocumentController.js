import UserService from "../../../services/UserService.js";
import DocumentService from "../../../services/DocumentService.js";
import notifEvent from "../../../events/NotificationEvent.js";
import { Types } from "mongoose";
import Document from "../../../models/Document.js";
import Role from "../../../models/Role.js";

class DocumentController{

    constructor(){
        this.UserService = new UserService();
        this.DocumentService = new DocumentService()
    }

    get = async (req,res) => {

        const data = await this.DocumentService.getByRole(req.user.role);
        const userConfirmedDocs = await this.UserService.getDocuments(req.user.id);

        for (const doc of data) {
            for (const userDoc of userConfirmedDocs.documents) {
                if(doc._id.toString() == userDoc.toString()){
                    doc.confirmed = true
                }else{
                    doc.confirmed = false
                }
            }
        }
        return res.json({"status":"success",data,userConfirmedDocs})
    }

    store = async (req,res) => {
        let doc_id = req.body.document_id
        await this.UserService.pushInCollection(req.user.id,doc_id,'documents')
        notifEvent.emit('send','ADMIN',JSON.stringify({type:'Подтвердил документ',message:req.user.email}));
        return res.json({"status":"success","message":"Saved success"})
    }

    getDocuments=async(req,res)=>{
        try {
            
            // const dbRole1=await Role.find({name:"USER"})
            const dbRole2=await Role.find({name:"document"})
            // const result1=await Document.find({owners:dbRole1})
            const result=await Document.find({owners:dbRole2})
            console.log(result,"result");
            let nameArray=[]
        //   console.log(dbRole);
            for(let i=0;i<result.length;i++){
                let obj={}
               let spl = result[i].path.split("/")
               let spl1=spl[1].split(".")
               obj.name=spl1[0]
               obj.path=result[i].path
               obj.owner=result[i].owners
               obj.id=result[i]._id
               obj.text=result[i].text
               obj.date=result[i].date
               nameArray.push(obj)
            }
            // console.log(nameArray,"nameArray");
            const resultDocuments=nameArray
            // console.log(nameArray,"nameArray");
        //    const resultDocuments= nameArray.filter((el)=>{
        //     return el.owner[0].toString()===dbRole2[0]._id.toString()})
            res.status(200).send(resultDocuments)
        } catch (error) {
            console.error(error)
        }
    }

    getDocumentsGlobal=async(req,res)=>{
        try {
            const result=await Document.find()
            const dbRole=await Role.find({name:"document"})
            let nameArray=[]
          console.log(dbRole);
            for(let i=0;i<result.length;i++){
                let obj={}
               let spl = result[i].path.split("/")
               let spl1=spl[1].split(".")
               obj.name=spl1[0]
               obj.path=result[i].path
               obj.owner=result[i].owners
               obj.id=result[i]._id
               nameArray.push(obj)
            }
            console.log(nameArray,"nameArray");
           const resultDocuments= nameArray.filter((el)=>{
            return el.owner[0].toString()===dbRole[0]._id.toString()})
            res.status(200).send(resultDocuments)
        } catch (error) {
            console.error(error)
        }
    }
}

export default new DocumentController();