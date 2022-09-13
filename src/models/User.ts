import mongoose from 'mongoose';
import {Schema, model} from 'mongoose';

const UserSchema = new Schema({
    userName: {type: String, required:true, unique:true},
    fullName: {type: String, required:true},
    email: {type: String, required:true},
    password: {type: String, required:true},
    creationDate: {type: Date, default:Date.now}, 
    role: { type: [String] }
})

export default model('User', UserSchema);