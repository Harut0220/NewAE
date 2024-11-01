import { Router } from "express";
import servicesController from "../../../controllers/api/service/servicesController.js";
import { isEmpParamObjId } from "../../../middlewares/isEmpty.js";


const serviceRouter=Router()

serviceRouter.post("/register",servicesController.registr)
serviceRouter.post("/confirm",servicesController.confirm)
serviceRouter.get("/near/:id",isEmpParamObjId,servicesController.near)
// serviceRouter.delete("/registr",servicesController.deleteRegistr)
serviceRouter.post("/edite",servicesController.editeService)
serviceRouter.post("/editeRegistr",servicesController.editeRegistr)
serviceRouter.get("/registers",servicesController.registers)
serviceRouter.get("/my_registers")
// serviceRouter.get("/my_service/register")




export default serviceRouter;