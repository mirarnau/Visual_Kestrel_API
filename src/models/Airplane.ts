import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const AirplaneSchema = new Schema({
    model: {type: String, required:true},
    weight: {type: Number},
    weightEmpty: {type: Number},
    fuelCapacity: {type: Number},
    gph: {type: Number},
    altitude: {type: Number},
    ktas: {type: Number},
    ceiling: {type: Number},
    



    country: {type: String, required: true},
    iata_code: {type: String, required: true},
    coordinates: {
        lat: {type: Number},
        long: {type: Number},
    }
})

export default model('Airplane', AirplaneSchema);