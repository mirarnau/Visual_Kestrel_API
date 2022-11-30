import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const AirportSchema = new Schema({
    name: {type: String, required:true},
    city: {type: String, required: true},
    community: {type: String},
    country: {type: String, required: true},
    timezone: {type: String},
    iata_code: {type: String},
    icao_code: {type: String, required: true},
    elevation: {type: Number},
    coordinates: {
        lat: {type: Number},
        long: {type: Number},
    }
})

export default model('Airport', AirportSchema);