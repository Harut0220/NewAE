import { Router } from "express";
import companyController from "../../../controllers/api/company/companyController.js";
import { isEmpParamObjId } from "../../../middlewares/isEmpty.js";
import authenticateJWT from "../../../middlewares/authJWT.js";
import newAuthJWT from "../../../middlewares/newAuthJWT.js";

const companyRoutes = Router();

companyRoutes.get("/my_favorites",newAuthJWT, companyController.myFavorites);
companyRoutes.get("/getCategories", companyController.getCategory);
companyRoutes.get("/days", companyController.days);
companyRoutes.get("/singl/:id",isEmpParamObjId, companyController.singl);
companyRoutes.get("/single/:id",isEmpParamObjId, companyController.single);
companyRoutes.get("/near/:id",isEmpParamObjId, companyController.near);
companyRoutes.get("/radius", companyController.radius);//kilometer motikic heru
companyRoutes.get("/my/companies",newAuthJWT, companyController.getMy);
companyRoutes.get("/popular", companyController.popular);
companyRoutes.get("/page", companyController.index);//for admin
// companyRoutes.put("/edite", companyController.editeCompany);
companyRoutes.post("/add",newAuthJWT, companyController.addCompany);
companyRoutes.post("/notif/opportunity",newAuthJWT, companyController.opportunity);
companyRoutes.post("/online/pay",newAuthJWT, companyController.online);
// companyRoutes.post("/confirm", companyController.confirm);
companyRoutes.post("/add/service", companyController.addService);
// companyRoutes.get("/documents",companyController.documents)
companyRoutes.get("/allCompanies", companyController.getCompanys);//kilometer motikic heru
companyRoutes.post("/like",newAuthJWT, companyController.like);
companyRoutes.post("/add/comment",newAuthJWT, companyController.addCommets);
companyRoutes.post("/comment/delete",newAuthJWT, companyController.commentDelete);
companyRoutes.post("/comment/like",newAuthJWT, companyController.commentLike);
companyRoutes.post("/comment/answer",newAuthJWT, companyController.commentAnswer);
companyRoutes.post("/comment/answer/delete",newAuthJWT, companyController.commentAnswerLike);
companyRoutes.post("/comment/answer/like",newAuthJWT, companyController.commentAnswerLike);
companyRoutes.post("/rating",newAuthJWT, companyController.rating);
companyRoutes.post("/add/favorite",newAuthJWT, companyController.addFavorites);

companyRoutes.delete("/delete", companyController.deleteCompany);

export default companyRoutes;
