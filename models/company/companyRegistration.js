import mongoose from "mongoose";
const { Schema, model } = mongoose;

const companyRegistrations = new Schema({
  ownerId:{type: Schema.Types.ObjectId, ref: 'User' },
  companyId:{ type: Schema.Types.ObjectId, ref: 'Company' },
  serviceId:{type: Schema.Types.ObjectId, ref: 'company_service' },
  startTime:{type:String,require:true},
  endTime:{type:String,require:true}
  
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

export default model("company_registrations", companyRegistrations);
