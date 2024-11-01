import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const EventCommentAnswer = new Schema({
  userId:{type: Schema.Types.ObjectId, ref: 'User' },
  commentId:{ type: Schema.Types.ObjectId, ref: 'event_comment' },
  text: {type:String},
  date:{type:String},
  likes:[{type:Schema.Types.ObjectId,ref:"event_answer_likes"}],
  isLike:{type:Boolean,default:false}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
})

export default model('event_comment_answer', EventCommentAnswer)