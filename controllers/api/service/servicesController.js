import moment from "moment";
import companyModel from "../../../models/company/companyModel.js";
import servicesRegistrations from "../../../models/services/servicesRegistrations.js";
import  mongoose  from "mongoose";
import CompanyServiceModel from "../../../models/company/companyService.js"
const {ObjectId}=mongoose.Types

const servicesController = {
  near: async (req, res) => {
    const  id  = req.params.id;
    const dbResult = await CompanyServiceModel.findById(id);
    res.status(200).send({message:"success",data:dbResult});
  },
  registers: async (req, res) => {
    try {
      // const authHeader = req.headers.authorization;
      const { serviceId,companyId } = req.body;
      // const token = authHeader.split(" ")[1];
      // const user = jwt.decode(token);
      const user = { id: "656ecb2e923c5a66768f4cd3" };
      const company=await companyModel.findById(companyId)
      const resObj = {};
      const resToday = [];
      const inFuture = [];
      const objectIdArray = company.services.map(id => ObjectId(id));
      const dbResult = await servicesRegistrations.find({ serviceId: { $in:objectIdArray } }).exec();
      // const dbResult = await servicesRegistrations.findById(...company.services);
 
      
      const formattedDate = moment.tz(process.env.TZ).format('YYYY-MM-DD');
      console.log(formattedDate);



      /////////////////////////////////////////////////////////
      function checkDateStatus(givenDateString) {
        // Parse the given date string (format YYYY-MM-DD)
        const givenDate = new Date(givenDateString);
        
        // Check if the given date is valid
        if (isNaN(givenDate.getTime())) {
          throw new Error('Invalid date format');
        }
      
        // Get today's date and set the time to the start of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Set the given date to midnight of that day
        givenDate.setHours(0, 0, 0, 0);
      
        // Compare the given date with today's date
        if (givenDate < today) {
          return 'The given date is in the past.';
        } else if (givenDate > today) {
          return "future";
        } else {
          return "today";
        }
      }
      
      // Example usage
      if(dbResult.length!==0){
      for(let i=0;i<dbResult.length;i++){

      
      // const dateToCheck = '2024-08-13';
      // const dateToCheck = '2024-08-12';
      try {
        const status = checkDateStatus(dbResult[i].date);
        if(status==="today"){
          resToday.push(dbResult[i])
        }else if(status==="future"){
          inFuture.push(dbResult[i])
        }else{
          console.log("//",status);
        }
      } catch (error) {
        console.error(error.message);
      }
    }
    resObj.inFuture=inFuture
    resObj.resToday=resToday

      ////////////////////////////////////////////////////////
      // console.log("//////////",resObj);
      }
      
      if (!resObj.inFuture&&!resObj.resToday) {
        res.status(200).send({ message: "у вас нет постов" });
      } else {
        res.status(200).send({ message: "success", resObj });
      }
    } catch (error) {
      console.error(error);
    }
  },
  editeRegistr: async (req, res) => {
    try {
      const { serviceRegistrId, date, time, text } = req.body;
      const service = await servicesRegistrations.findOneAndUpdate(
        { _id: serviceRegistrId }, // Filter criteria
        { $set: { date: date } },
        { $set: { time: time } },
        { $set: { text: text } },
        { $set: { status: 0 } }, // Update action
        { returnOriginal: false } // Return the updated document
      );
      console.log(service);
      res
        .status(200)
        .send({ message: "Время успешно отправлено, на рассмотрении" });
    } catch (error) {
      console.error(error);
    }
  },
  editeService: async (req, res) => {
    try {
      const { serviceId } = req.body;
    } catch (error) {
      console.error(error);
    }
  },
  confirm: async (req, res) => {
    try {
      const { serviceRegistrId } = req.body;
      const service = await servicesRegistrations.findOneAndUpdate(
        { _id: serviceRegistrId }, // Filter criteria
        { $set: { status: 1 } }, // Update action
        { returnOriginal: false } // Return the updated document
      );
      res.status(200).send({ message: "запись подтверждена." });
    } catch (error) {
      console.error(error);
    }
  },
  registr: async (req, res) => {
    try {
      // const authHeader = req.headers.authorization;
      const { serviceId, date, time, text } = req.body;
      const service=await CompanyServiceModel.findById(serviceId)
      // const token = authHeader.split(" ")[1];
      // const user = jwt.decode(token);
      const user = { id: "656ecb2e923c5a66768f4cd3" };
        const Db = new servicesRegistrations({
          serviceId,
          date,
          time,
          text,
          userId: user.id,
        });
        await Db.save();
    
        await service.serviceRegister.push(Db._id)
        await service.save()
      

      res.status(200).send({ message: "запись отправлено." });
    } catch (error) {
      console.error(error);
    }
  },
  deleteRegistr: async (req, res) => {
    try {
      const {} = req.body;
    } catch (error) {
      console.error(error);
    }
  },
};

export default servicesController;
