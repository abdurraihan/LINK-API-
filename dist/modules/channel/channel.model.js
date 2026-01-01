import mongoose, { Schema } from "mongoose";
const channelSchema = new Schema({
    channelName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        required: true,
        default: "channel discriptin "
    },
    channelIcon: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    links: {
        type: String
    },
    totalSubscribers: {
        type: Number,
        default: 0,
    },
    totalViews: {
        type: Number,
        default: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0,
    },
    totalWatchTime: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const Channel = mongoose.model("Channel", channelSchema);
export default Channel;
