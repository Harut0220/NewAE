
import jwt  from "jsonwebtoken";
import User from "../models/User.js";

const authenticateJWT =async (req, res, next) => {
    console.log('authenticateJWT: ', req.body);
    const authHeader = req.headers.authorization;
    console.log(authHeader,"authHeader");
    if (authHeader) {
        const token = authHeader.split(' ')[1];

       const user = jwt.decode(token);
       console.log(user,"user");
       let u = await User.findById(user.id).populate("roles")
       console.log(u,"u");
       if(u){
           user.name = u.name;
           user.surname = u.surname;
           user.email = u.email;
           user.phone_number = u.phone_number;
           user.role_name = u.roles.name;
           req.user = user;
        //    console.log("aaaaaaa");
           next();
       }else{
           res.sendStatus(401);
       }
    } else {
        res.sendStatus(401);
    }
    next()
};

export default authenticateJWT;