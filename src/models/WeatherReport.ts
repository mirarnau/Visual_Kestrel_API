import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const WeatherReportSchema = new Schema({
    lat: {type: Number},
    long: {type: Number},
    timezone: {type: String},
    current :{
        dt: {type: Number},
        sunrise: {type: Number},
        sunset: {type: Number},
        temp: {type: Number},
        pressure: {type: Number},
        humidity: {type: Number},
        dew_point: {type: Number},
        clouds: {type: Number},
        visibility: {type: Number},
        wind_speed: {type: Number},
        wind_deg: {type: Number},
        weather: [
            {
                main: {type: String},
                description: {type: String},
                icon: {type: String},
            }
        ],
    },
    hourly: [
        {
            dt: {type: Number},
            sunrise: {type: Number},
            sunset: {type: Number},
            temp: {type: Number},
            pressure: {type: Number},
            humidity: {type: Number},
            dew_point: {type: Number},
            clouds: {type: Number},
            visibility: {type: Number},
            wind_speed: {type: Number},
            wind_deg: {type: Number},
            wind_gust: {type: Number},
            weather: 
                {
                    main: {type: String},
                    description: {type: String},
                    icon: {type: String},
                }
            ,
        }
    ],
    daily: [
        {
            dt: {type: Number},
            sunrise: {type: Number},
            sunset: {type: Number},
            temp: {
                day: {type: Number},
                night: {type: Number},
                min: {type: Number},
                max: {type: Number},
                eve: {type: Number},
                morn: {type: Number}
            },
            pressure: {type: Number},
            humidity: {type: Number},
            dew_point: {type: Number},
            clouds: {type: Number},
            visibility: {type: Number},
            wind_speed: {type: Number},
            wind_deg: {type: Number},
            wind_gust: {type: Number},
            weather: [
                {
                    main: {type: String},
                    description: {type: String},
                    icon: {type: String},
                }
            ],
        }
    ],
    alerts: [
        {
            sender_name: {type: String},
            event: {type: String},
            start: {type: Number},
            end: {type: Number},
            description: {type: String},
            tags: [{type: String}]
        }
    ]

    
})

export default model('WeaterReport', WeatherReportSchema);