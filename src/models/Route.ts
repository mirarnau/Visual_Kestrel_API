import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const FlightRouteSchema = new Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    routeName: {type: String},
    listWayPoints: [
        {
            pointName: {type: String},
            comments: {type: String},
            coordinates: 
            {
                lat: {type: Number},
                long: {type: Number}            
            }
        }
    ],
    creationDate: {type: Date, default:Date.now}
})

export default model('FlightRoute', FlightRouteSchema);