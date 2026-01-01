import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Username must be at least 2 characters long'],
        maxlength: [50, 'Username cannot exceed 50 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long']
    },
    avatar: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        required: false,
        expires: 300,
    },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
