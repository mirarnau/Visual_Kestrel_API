import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const AirportSchema = new Schema({
    name: {type: String, required:true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    iata_code: {type: String, required: true},
    coordinates: {
        lat: {type: Number},
        long: {type: Number},
    }
})

export default model('Airport', AirportSchema);