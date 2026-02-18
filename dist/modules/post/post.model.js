import mongoose, { Schema } from "mongoose";
const postSchema = new Schema({
    description: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    media: {
        type: [
            {
                url: { type: String, required: true },
            },
        ],
        required: true,
        validate: [
            (val) => val.length > 0,
            "At least one media is required",
        ],
    },
    hashtags: {
        type: [String],
        default: [],
        index: true,
    },
    taggedPeople: [
        {
            type: Schema.Types.ObjectId,
            ref: "Channel",
        },
    ],
    links: {
        type: String
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
        index: true,
    },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
}, {
    timestamps: true,
    versionKey: false,
});
postSchema.index({ description: 'text', hashtags: 'text' });
const Post = mongoose.model("Post", postSchema);
export default Post;
