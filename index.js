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

app.get("/test1", async (req, res) => {
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

/*
app.use('/a',express.static('/b'));
Above line would serve all files/folders inside of the 'b' directory
And make them accessible through http://localhost:3000/a.
*/

// app.use(express.static(__dirname + "/public"));

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = './uploads';
//     // Create uploads directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // Mocked UploadService for demonstration
// const UploadService = {
//   storeLowResImage: async (fileData) => {
//     // Your logic to store low-resolution images
//     // Return the path where the image is stored
//     return '/path/to/low-res-image';
//   },
//   storeSync: async (file, dir) => {
//     // Your logic to store file synchronously
//     // Return the path where the file is stored
//     console.log(file.filename,"file.filename");
//     return `/uploads/${file.filename}`;
//   }
// };

// // Single file upload endpoint
// app.post('/api/upload_single_file', upload.single('profile-file'), async function (req, res, next) {
//   try {
//     // Access the uploaded file
//     const file = req.file;
//     console.log(file,"file");
//     if (!file) {
//       return res.status(400).send('No file uploaded.');
//     }

//     let path = '';

//     if (file.mimetype && file.mimetype.includes('image')) {
//       path = await UploadService.storeLowResImage(file.buffer);  // Use file.buffer for in-memory file data
//     } else {
//       path = await UploadService.storeSync(file, 'uploads');
//     }

//     console.log(path);
//     return res.send({ path });
//   } catch (error) {
//     console.error('Error handling file upload:', error);
//     return res.status(500).send('Internal server error');
//   }
// });

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// })
// var upload = multer({ storage: storage })
// app.post('/api/upload_single_file', upload.single('profile-file'),async function (req, res, next) {
//        const file = req.files.file;
//        let path = '';
// if(file.mimetype && file.mimetype.includes('image')){
//     path = await UploadService.storeLowResImage(file.data);
// }else{
//     path = await UploadService.storeSync(file,'uploads');
// }
// console.log(path);
// return res.send({path})
// });

// app.post('/profile-upload-multiple', upload.array('profile-files', 12), function (req, res, next) {
// // req.files is array of `profile-files` files
// // req.body will contain the text fields, if there were any
// var response = '<a href="/">Home</a><br>'
// response += "Files uploaded successfully.<br>"
// for(var i=0;i<req.files.length;i++){
// response += `<img src="${req.files[i].path}" /><br>`
// }

// return res.send(response)
// })

// app.post("/downloadFile", () => {
//   saveImageToDisk(
//     "file:///data/user/0/com.alleven/cache/rn_image_picker_lib_temp_f3879c23-61c7-43b6-b659-dee08b8471c3.jpg",
//     `./` + `nkaredo` + ".png"
//   )
//     .then(() => {
//       console.log("File downloaded successfully!");
//     })
//     .catch((error) => {
//       console.error("Error downloading file:", error);
//     });
// });

const time =new Date()

// console.log(time.getUTCHours())

const start = async () => {
  await connect();
  app.listen(process.env.PORT, () =>
    console.log(`Server started ${process.env.PORT}`)
  );
};

start();
