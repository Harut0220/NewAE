import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const servicesRegistrations = new Schema({
    serviceId:{type : Schema.Types.ObjectId,ref:"company_service"},
    date:{type:String,require:true},
    status:{type:Number,default:0},
    userId:{ type: Schema.Types.ObjectId, ref: "User" },
    text:{type:String},
    time:{type:String}
}, {
    timestamps: true // This will add createdAt and updatedAt fields
  })



export default model('services_registrations',servicesRegistrations)