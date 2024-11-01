import mongoose from 'mongoose';
const { Schema,model } = mongoose;

const EventParticipants = new Schema({
    userId:{type:Schema.Types.ObjectId,ref:"User"},
    eventId:{type:Schema.Types.ObjectId,ref:"Event"},
    date:{type:String}
 }, {
    timestamps: true // This will add createdAt and updatedAt fields
  })



export default model('event_participants',EventParticipants)