import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';
import { type } from 'os';
import Point from './Point';
import Polygon from './Polygon';

const AirspaceSchema = new Schema({
    airspaceClass: {type: String, required:true},
    polygones: [{type: Polygon}],
    points: [{type: Point}]
})

export default model('Airspace', AirspaceSchema);