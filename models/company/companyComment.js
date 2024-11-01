import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CompanyComment = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    text: { type: String },
    date: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: "companyComment_likes" }],
    answer: [{ type: Schema.Types.ObjectId, ref: "company_comment_answer" }],
    isLike: { type: Boolean, default: false },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

export default model("company_comment", CompanyComment);
