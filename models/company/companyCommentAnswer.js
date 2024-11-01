import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const CompanyCommentAnswer = new Schema({
  userId:{type: Schema.Types.ObjectId, ref: 'User' },
  commentId:{ type: Schema.Types.ObjectId, ref: 'company_comment' },
  companyId:{ type: Schema.Types.ObjectId, ref: 'Company' },
  text: {type:String},
  date:{type:String},
  likes:[{type:Schema.Types.ObjectId,ref:"comment_answer_likes"}],
  isLike:{type:Boolean,default:false}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
})

export default model('company_comment_answer', CompanyCommentAnswer)