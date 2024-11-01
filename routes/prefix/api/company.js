import { Router } from "express";
import companyController from "../../../controllers/api/company/companyController.js";
import { isEmpParamObjId } from "../../../middlewares/isEmpty.js";

const companyRoutes = Router();

// companyRoutes.get("/categories", companyController.category);

companyRoutes.get("/my_favorites", companyController.myFavorites);

companyRoutes.get("/getCategories", companyController.getCategory);

companyRoutes.get("/days", companyController.days);

// companyRoutes.get("/profile/single/:id",companyController.profileSingle)

companyRoutes.get("/singl/:id",isEmpParamObjId, companyController.singl);
companyRoutes.get("/single/:id",isEmpParamObjId, companyController.single);

companyRoutes.get("/near/:id",isEmpParamObjId, companyController.near);

companyRoutes.get("/radius", companyController.radius);//kilometer motikic heru

companyRoutes.get("/my_companys", companyController.getMy);

companyRoutes.get("/popular", companyController.popular);

companyRoutes.get("/page", companyController.index);//for admin

// companyRoutes.put("/edite", companyController.editeCompany);

companyRoutes.post("/add", companyController.addCompany);

companyRoutes.post("/notif/opportunity", companyController.opportunity);
companyRoutes.post("/online/pay", companyController.online);
// companyRoutes.post("/confirm", companyController.confirm);

companyRoutes.post("/add/service", companyController.addService);
// companyRoutes.get("/getOne",companyController.getOne)//
// companyRoutes.post('/company_registrations',companyController.registration)
// companyRoutes.get("/documents",companyController.documents)
companyRoutes.get("/allCompanies", companyController.getCompanys);//kilometer motikic heru
companyRoutes.post("/like", companyController.like);

companyRoutes.post("/add/comment", companyController.addCommets);
companyRoutes.post("/comment/like", companyController.commentLike);
companyRoutes.post("/comment/answer", companyController.commentAnswer);
companyRoutes.post("/comment/answer/like", companyController.commentAnswerLike);
companyRoutes.post("/rating", companyController.rating);
companyRoutes.post("/add/favorite", companyController.addFavorites);

companyRoutes.delete("/delete", companyController.deleteCompany);

export default companyRoutes;
