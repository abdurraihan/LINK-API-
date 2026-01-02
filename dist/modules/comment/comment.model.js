import mongoose, { Schema } from "mongoose";
const commentSchema = new Schema({
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        enum: ["Post", "Short"],
        required: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
