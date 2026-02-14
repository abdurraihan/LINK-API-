import mongoose, { Schema } from "mongoose";
const commentReactSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true,
        index: true,
    },
    reactionType: {
        type: String,
        enum: ["like", "dislike"],
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
commentReactSchema.index({ user: 1, comment: 1 }, { unique: true });
commentReactSchema.index({ comment: 1, reactionType: 1 });
const CommentReact = mongoose.model("CommentReact", commentReactSchema);
export default CommentReact;
