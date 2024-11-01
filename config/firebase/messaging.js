import admin from "firebase-admin";
import serviceAccount from "./adminsdk_old.json" assert { type: "json" };
// console.log(serviceAccount);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export { admin };