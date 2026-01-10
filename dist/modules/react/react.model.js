import mongoose, { Schema } from "mongoose";
const reactSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        enum: ["Video", "Short", "Post"],
        required: true,
        index: true,
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "targetType",
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
// Compound index to ensure one reaction per user per target
reactSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
// Index for querying reactions by target
reactSchema.index({ targetType: 1, targetId: 1, reactionType: 1 });
const React = mongoose.model("React", reactSchema);
export default React;
