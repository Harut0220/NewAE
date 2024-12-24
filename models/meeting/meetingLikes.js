import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const MeetingLikes = new Schema({
  user:{type: Schema.Types.ObjectId, ref: 'User' },
  meetingId:{ type: Schema.Types.ObjectId, ref: 'Company' },
  date:{type:String,
  required:true}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
})

export default model('meeting_likes',MeetingLikes)