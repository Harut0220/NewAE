import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const MeetingComment = new Schema({
  userId:{type: Schema.Types.ObjectId, ref: 'User' },
  meetingId:{ type: Schema.Types.ObjectId, ref: 'Meeting' },
  text: {type:String},
  date:{type:String},
  likes:[{type:Schema.Types.ObjectId,ref:"meetingComment_likes"}],
  answer:[{type:Schema.Types.ObjectId,ref:"meeting_comment_answer"}],
  isLike:{type:Boolean,default:false}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
})

export default model('meeting_comment', MeetingComment)