import { Router } from "express";
import companyController from "../../../controllers/api/company/companyController.js";
import EventController from "../../../controllers/user/profile/EventController.js";
import { isEmpParamObjId } from "../../../middlewares/isEmpty.js";

const companyAdminRouter=Router()

companyAdminRouter.get("/single/:id",isEmpParamObjId, EventController.singleCompany);
companyAdminRouter.get("/single/pay/:id",isEmpParamObjId, companyController.singlePay);
companyAdminRouter.get("/show/:id",isEmpParamObjId, EventController.companyShow);
companyAdminRouter.post("/destroy/many", EventController.destroyCompany);//must be DELETE
companyAdminRouter.delete("/image/:id",isEmpParamObjId, EventController.destroyCompanyImage);
companyAdminRouter.post("/resolve/:id",isEmpParamObjId, companyController.resolve);
companyAdminRouter.get("/resolve/:id",isEmpParamObjId, companyController.resolve);
companyAdminRouter.post("/reject/:id",isEmpParamObjId,companyController.reject)
companyAdminRouter.get("/reject/:id",isEmpParamObjId,companyController.reject)
companyAdminRouter.get("/online",companyController.onlinePage);

companyAdminRouter.get("/page",companyController.index);



export default companyAdminRouter