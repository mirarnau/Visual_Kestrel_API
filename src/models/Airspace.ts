import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const AirspaceSchema = new Schema({
    airspaceClass: {type: String, required:true},
    polygones: [{
        transparent: {type: Number}, // 0:filled, 1:not_filled
        points: [{
            coordinates: {
                lat: {type: Number},
                long: {type: Number},
            }
        }]
    }],
    points: [{
        name: {type: String},
        coordinates: {
            lat: {type: Number},
            long: {type: Number},
        }
    }]
})

export default model('Airspace', AirspaceSchema);