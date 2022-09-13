import mongoose from 'mongoose';
import {Schema, model} from 'mongoose';

const PointSchema = new Schema({
    name: {type: String},
    coordinates: {
        lat: {type: Number},
        long: {type: Number},
    }
})

export default model('Point', PointSchema);