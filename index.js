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
import moment from "moment-timezone";
import { isEmpParamObjId } from "./middlewares/isEmpty.js";
import newAuthJWT from "./middlewares/newAuthJWT.js";
import shareRoutes from "./routes/share.js";
import Document from "./models/Document.js";
import User from "./models/User.js";
import { admin } from "./config/firebase/messaging.js";
// Your code using multer here

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
// const template =
// `<div class="invitation">
//     <p>
//       {{ greeting }} | {{ description }}
//     </p>
//     <img src="{{imageUrl}}" alt="Invitation Image" />
//   </div>`
// ;
// // Data to pass into the template
// const data = {
//   greeting: "Online Invitation Card Platform",
//   description: "We invite you to a birthday party",
//   imageUrl:
//     "https://chatapi.trigger.ltd/uploads/7415c8e5-9b4f-4ed9-b6d1-893267b413af.jpeg",
// };

// // Compile and render the template
// const compiledTemplate = handlebars.compile(template);
// const result = compiledTemplate(data);

// Output the result (you can insert it into your HTML)
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
app.use(shareRoutes);
app.use("/admin", webRoutes);
app.use(wsRoutes);
app.use("/api", apiRoutes);
app.use("/report", reportRoutes);
app.use("/seed", seedRouter);
app.use(reedRouter);
app.get("/some-route", (req, res) => {
  res.render("someTemplate", { url: process.env.URL });
});

// app.get("/test", async (req, res) => {
//   const sendPushNotification = async (token, content) => {
//     // const token = user.firebaseToken;

//     if (!token) {
//       return;
//     }
//     for (let i = 0; i < token.length; i++) {
//       console.log("Sending notification to:", token[i]);
//       const condition = "'stock-GOOG' in topics || 'industry-tech' in topics";

//       const message = {
//         notification: {
//           title: "Նոր հաղորդագրություն",
//           body: content,
//         },
//         token: token[i],
//         condition: condition,
//         data: {},
//         apns: {
//           headers: {
//             "apns-priority": "10",
//             "apns-push-type": "alert",
//           },
//           payload: {
//             aps: {
//               alert: {
//                 title: "Նոր հաղորդագրություն",
//                 body: content,
//               },
//               sound: "default",
//             },
//           },
//         },
//       };

//       try {
//         const response = await admin.messaging().send(message);
//         console.log("Successfully sent message:", response);
//       } catch (error) {
//         console.error("Error sending message:", error);

//         // Check for the specific error regarding invalid registration tokens
//         if (
//           error.errorInfo &&
//           error.errorInfo.code === "messaging/registration-token-not-registered"
//         ) {
//           console.log(`Removing invalid token for user `);
//           try {
//             // Remove or invalidate the token in the database
//             // await User.updateOne({ _id: user._id }, { $unset: { firebaseToken: 1 } });
//             console.log(`Token removed for user `);
//           } catch (error) {
//             console.error(`Error updating database for user:`);
//           }
//         }
//       }
//     }
//   };
//   const user = await User.findById("67370e18ce5cd4db33b70deb");

//   await sendPushNotification(user.fcm_token, "namak");
//   res.send("1");
// });

// console.log(moment.tz(process.env.TZ).format("YYYY-MM-DD"));

////////////////////////////////////////////////////////////

const start = async () => {
  await connect();
  app.listen(process.env.PORT, () =>
    console.log(`Server started ${process.env.PORT}`)
  );
};

start();
