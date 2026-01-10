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
// Compound index to ensure one reaction per user per comment
commentReactSchema.index({ user: 1, comment: 1 }, { unique: true });
// Index for querying reactions by comment
commentReactSchema.index({ comment: 1, reactionType: 1 });
const CommentReact = mongoose.model("CommentReact", commentReactSchema);
export default CommentReact;
