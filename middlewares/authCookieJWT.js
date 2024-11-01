
import jwt  from "jsonwebtoken";
import User from "../models/User.js";

const authCookieJWT = async (req, res, next) => {
    const token = req.cookies.alleven_token;

    if (token) {
        jwt.verify(token, process.env.API_TOKEN, async (err, user) => {
            if (err) {
                return res.redirect('/admin/login');
            }

            req.user = await User.findById(user.id).populate('roles').lean();
            next();
        });
    } else {
        res.redirect('/admin/login');
    }
};

export default authCookieJWT;