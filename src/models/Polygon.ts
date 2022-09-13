import mongoose from 'mongoose';
import {Schema, model} from 'mongoose';
import { type } from 'os';
import Point from './Point';

const PolygonSchema = new Schema({
    transparent: {type: Number}, // 0:filled, 1:not_filled
    points: [{type: Point}]
})

export default model('Polygon', PolygonSchema);