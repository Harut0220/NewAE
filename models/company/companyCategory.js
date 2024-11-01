import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CompanyCategory = new Schema({
  name: { type: String },
  image:{type:String}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

export default model("company_category", CompanyCategory);
