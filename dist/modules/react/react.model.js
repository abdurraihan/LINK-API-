import mongoose, { Schema } from "mongoose";
const reactionSchema = new Schema({
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
    type: {
        type: String,
        enum: ["like", "dislike"],
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// One reaction per user per target
reactionSchema.index({ targetId: 1, targetType: 1, user: 1 }, { unique: true });
const Reaction = mongoose.model("Reaction", reactionSchema);
export default Reaction;
