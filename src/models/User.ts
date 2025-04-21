import { model, Schema } from "mongoose";

const userSchema:Schema = new Schema({
    name: {
        type: String,
        required:true
    },
    email: {
        type: String,
        required:true,
        unique: true
    },
    password: {
        type: String,
        required:true,
        minLength: 6,
    },
    blogs: [{types: Schema.Types.ObjectId, ref: 'Blog'}],
    comments: [{types: Schema.Types.ObjectId, ref: 'Comment'}]
})

export default model("User", userSchema)