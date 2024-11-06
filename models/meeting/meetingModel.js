import mongoose from "mongoose";
const { Schema, model } = mongoose;

const Meeting = new Schema(
  {
    purpose: { type: String, required: true },
    description: { type: String ,default:"" },
    ticket: { type: String, default: null },
    address: { type: String, require: true },
    lon: { type: Number, required: true },
    phone: { type: String, require: true },
    lan: { type: Number, required: true },
    kilometr: { type: Number, default: 0 },
    date: { type: String, require: true },
    status: { type: Number, default: 0 },
    images: [{ type: Schema.Types.ObjectId, ref: "meeting_images" }],
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    comments: [{ type: Schema.Types.ObjectId, ref: "meeting_comment" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "meeting_likes" }],
    participantSpot: [{ type: Schema.Types.ObjectId, ref: "User" }],
    view: [{ type: Schema.Types.ObjectId, ref: "meeting_views" }],
    ratings: [{ type: Schema.Types.ObjectId, ref: "meeting_rating" }],
    ratingCalculated: { type: Number, default: 0},
    favorites: [{ type: Schema.Types.ObjectId, ref: "meeting_favorites" }],
    statusMeeting: { type: String, default: "null" },
    changedStatusDate: {
      type: String,
      default: "0000-00-00T00:00:00.00+00:00",
    },
    situation:{
      type:String,
      default:"upcoming"},
    joinStatus: { type: Number, default: 1 },
    isFavorite: { type: Boolean, default: false },
    isLike: { type: Boolean, default: false },
    isRating: { type: Boolean, default: false },
    changes: {
      like: { type: Boolean, default: false },
      comment: { type: Boolean, default: false },
      participant: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      favorites: { type: Boolean, default: false },
      count: { type: Number, default: 0 },
      // joinStatus:{type:Number,default:1},
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

export default model("Meeting", Meeting);
