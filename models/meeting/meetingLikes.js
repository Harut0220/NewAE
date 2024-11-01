import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const MeetingLikes = new Schema({
  userId:{type: Schema.Types.ObjectId, ref: 'User' },
  meetingId:{ type: Schema.Types.ObjectId, ref: 'Company' },
  date:{type:String}
}, {
  timestamps: true // This will add createdAt and updatedAt fields
})

export default model('meeting_likes',MeetingLikes)