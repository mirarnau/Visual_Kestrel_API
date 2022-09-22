import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const RouteSchema = new Schema({
    routeName: {type: String},
    user: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    listWayPoints: [
        {
            pointName: {type: String},
            coordinates: 
            {
                lat: {type: Number},
                long: {type: Number}            
            }
        }
    ],
    creationDate: {type: Date, default:Date.now}
})

export default model('Route', RouteSchema);