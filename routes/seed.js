import { Router } from "express";
import categoryCompany from "../public/categoryCompany.js";
import companyCategory from "../models/company/companyCategory.js";
import eventCategory from "../public/eventCategory.js";
import EventCategory from "../models/event/EventCategory.js";


const seedRouter=Router()


seedRouter.get("/companyCategory", async (req, res) => {
    try {
      await companyCategory.deleteMany();
      await companyCategory.insertMany(categoryCompany)
  
     const dbResult=await companyCategory.find()
   
    res.status(200).send(dbResult);
    } catch (error) {
      console.error(error)
    }
  
})

seedRouter.get("/eventCategory",async(req,res)=>{
    try {
      await EventCategory.deleteMany()
      await EventCategory.insertMany(eventCategory)
  
      const dbResult=await EventCategory.find()
      res.status(200).send(dbResult)
    } catch (error) {
      console.error(error)
    }
  })




export default seedRouter