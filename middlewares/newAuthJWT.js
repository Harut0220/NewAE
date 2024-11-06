
import jwt  from "jsonwebtoken";
import User from "../models/User.js";

const newAuthJWT = async (req, res, next) => {
    console.log('authenticateJWT: ', req.body);
    const authHeader = req.headers.authorization;
    console.log(authHeader, "authHeader");

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const user = jwt.decode(token);
        console.log(user, "user");

        try {
            let u = await User.findById(user.id).populate("roles");
            console.log(u, "u");

            if (u) {
                return next(); // Exit the middleware if user is found
            } else {
                return res.status(401).send({ message: "User not found" }); // Exit if user is not found
            }
        } catch (err) {
            console.error(err);
            return res.status(500).send({ message: "Internal server error" }); // Handle any database errors
        }
    } 

    // This will only execute if authHeader is missing
    return res.status(403).send({ message: "Unauthorized" });
};


export default newAuthJWT;