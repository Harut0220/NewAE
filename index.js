import express from "express";
import dotenv from "dotenv";
// import mongoose from 'mongoose';
import { engine, create } from "express-handlebars";
import handlebars from "handlebars";
import { webRoutes } from "./routes/web.js";
import { apiRoutes } from "./routes/api.js";
import { wsRoutes } from "./routes/ws.js";
import connect from "./db/db.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import h from "./helper/global.js";
import fileupload from "express-fileupload";
import expressWs from "express-ws";
import cors from "cors";
import cron from "./cron/notification.js";
import path from "path";
// import moment from "moment";
import ShareEventController from "./controllers/share/ShareEventController.js";
// import mime from "mime";
import { reportRoutes } from "./routes/report.js";
// import multer from "multer";
// import companyCategory from "./models/company/companyCategory.js";
// import path from 'path';
// import fs from "fs";
// import saveImageToDisk from "./imageController/imageController.js";
// import categoryCompany from "./public/categoryCompany.js";
// import eventCategory from "./public/eventCategory.js";
// import EventCategory from "./models/event/EventCategory.js";
// import UploadService from "./services/UploadService.js";
import companyModel from "./models/company/companyModel.js";
import seedRouter from "./routes/seed.js";
import reedRouter from "./routes/reed.js";
import { dateNow } from "./config/timestamps.js";
import moment from "moment";
import { isEmpParamObjId } from "./middlewares/isEmpty.js";
import newAuthJWT from "./middlewares/newAuthJWT.js";
// Your code using multer here

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
expressWs(app);
const hbs = create({
  defaultLayout: "main",
  extname: "hbs",
  helpers: h,
  // allowProtoPropertiesByDefault: true,
  // allowProtoMethodsByDefault: true
});

app.use(cors({ origin: "*" }));
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(
  fileupload({
    defCharset: "utf8",
    defParamCharset: "utf8",
  })
);
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
);
app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));
app.use("/categories", express.static("categories"));

app.use(cookieParser({ secret: process.env.API_TOKEN }));
app.use(bodyParser.json({ limit: "500mb", parameterLimit: 10000 }));
app.use(bodyParser.raw({ limit: "500mb", parameterLimit: 100000 }));
app.use(bodyParser.text({ limit: "500mb", parameterLimit: 10000 }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

// app.get('/',(req,res)=>{
//   res.redirect('/admin/login');
// });

app.get("/event/:id",isEmpParamObjId, ShareEventController.index);
app.get("/meeting/:id",isEmpParamObjId, ShareEventController.meetIndex);
app.get("/company/:id",isEmpParamObjId, ShareEventController.companyIndex);
app.get("/service/:id",isEmpParamObjId, ShareEventController.serviceIndex);
app.use("/admin", webRoutes);
app.use(wsRoutes);
app.use("/api", apiRoutes);
app.use("/report", reportRoutes);
app.use("/seed", seedRouter);
app.use(reedRouter);
app.get('/some-route', (req, res) => {
  res.render('someTemplate', { url: process.env.URL });
});

app.get("/test1",newAuthJWT, async (req, res) => {
  function getFormattedDate() {
    const date = new Date();

    const pad = (n) => n.toString().padStart(2, "0"); // Helper function to pad numbers to 2 digits

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are zero-indexed, so we add 1
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = date
      .getMilliseconds()
      .toString()
      .padStart(3, "0"); // Pad milliseconds to 3 digits

    // Timezone offset in minutes, and converting it to hours and minutes
    const tzOffset = date.getTimezoneOffset();
    const tzSign = tzOffset > 0 ? "-" : "+";
    const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
    const tzMinutes = pad(Math.abs(tzOffset) % 60);

    // Constructing the final string in the desired format
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${tzSign}${tzHours}:${tzMinutes}`;
  }
  console.log(getFormattedDate(),"llllllllllllllll");
  
  const moscowTime = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm');
  console.log(moscowTime);
  res.send(moscowTime);
});





//////////////////////////////////////////////////////////////
// const event = {
//   _id: "67208c314b6ae258392abdd3",
//   purpose: "dwqwqqwd",
//   description: "dwqdqwdwq",
//   ticket: "www.limk.am",
//   address: "Oshakan, Armenia",
//   lat: 40.2654304,
//   lon: 44.3099177,
//   date: "2024-11-05T15:09:00",
//   status: 1,
// };

// // Calculate notification time (1 hour before event)
// const eventTime = moment.tz(event.date, "Asia/Yerevan");
// const notificationTime = eventTime.clone().subtract(1, 'hours').toDate();
// // const eventTime = moment(event.date);
// // const notificationTime = eventTime.subtract(1, 'hours').toDate();
// console.log("Notification time:", notificationTime);

// // Function to send a push notification
// function sendNotification() {
//   const message = {
//     notification: {
//       title: "Event Reminder!",
//       body: `The event is starting in 1 hour at ${event.address}. Don't miss it!`,
//     },
//     data: {
//       eventId: event._id.toString(),
//       ticketLink: event.ticket,
//       eventTime: event.date
//     },
//     topic: "event_reminders"  // Replace with the topic or targeted user/device token
//   };
//   console.log("Notification message:", message);
  

//   // Send the notification
//   admin.messaging().send(message)
//     .then(response => {
//       console.log("Notification sent successfully:", response);
//     })
//     .catch(error => {
//       console.error("Error sending notification:", error);
//     });
// }

// // Schedule notification
// const scheduleNotification = () => {
//   const now = new Date();
//   const timeUntilNotification = notificationTime - now;

//   if (timeUntilNotification > 0) {
//     setTimeout(sendNotification, timeUntilNotification);
//     console.log(`Notification scheduled for ${notificationTime}`);
//   } else {
//     console.log("The event time has already passed.");
//   }
// };

// // Start the scheduling function
// scheduleNotification();





///////////////////////////////////////////////////////////////


const start = async () => {
  await connect();
  app.listen(process.env.PORT, () =>
    console.log(`Server started ${process.env.PORT}`)
  );
};

start();
