import mongoose from "mongoose";
export const { Schema, model } = mongoose;

const CompanyServiceModel = new Schema({
  type: {type:String},
  description: {type:String},
  images: {type:Array},
  cost: {type:Number},
  companyId:{ type: Schema.Types.ObjectId, ref: 'Company' },
  serviceRegister:[{ type: Schema.Types.ObjectId, ref: "services_registrations" }]
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

export default model("company_service", CompanyServiceModel);
