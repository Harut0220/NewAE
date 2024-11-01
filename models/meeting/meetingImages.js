import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const MeetingImages = new Schema({
    meetingId:{type:Schema.Types.ObjectId,ref:"Meeting"},
    path:{type:String}
  })

export default model('meeting_images',MeetingImages)