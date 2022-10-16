import mongoose, { Mongoose } from 'mongoose';
import {Schema, model} from 'mongoose';

const AirplaneSchema = new Schema({
    model: {type: String, required:true},
    weight_empty: {type: Number},
    recat_eu: {type: String},
    rpm_average: {type: Number},
    fuelCapacity: {type: Number},
    ceiling: {type: Number},

    //TAKEOF PERFORMANCE
    performance_takeof: 
    {
        conditions: [{type: String}],
        mtow: {type: Number}, 
        ground_roll_takeoff: {type: Number},
        total_distance_50ft: {type: Number},
        takeof_ias: {type: Number},
    },
    
    //CLIMB PERFORMANCE
    performance_climb: 
    {
        conditions: [{type: String}],
        data: [
            {
                pressure_altitude: {type: Number},
                temp_celsius: {type: Number},
                climb_speed_kias: {type: Number},
                rate_climb_fpm: {type: Number},
                time_minutes: {type: Number},
                fuel_used_gallons: {type: Number},
                distance_nm: {type: Number},
            }
        ],
    },

    //CRUISE PERFORMANCE - Standard temperature
    performance_cruise:
    {
        conditions: [{type: String}],
        data:
        [
            {
                pressure_altitude: {type: Number},
                bhp_percentage: {type: Number},
                ktas: {type: Number},
                gph: {type: Number},
            }
        ],
    },      
    
    //DESCENT TO FL 100 PERFORMANCE
    performance_descent:
    {   
        level_to_descend_ft: {type: String},
        kias: {type: Number},
        rate_descent_fpm: {type: Number}
    },

    //APPROACH PERFORMANCE
    performance_approach:
    {  
        kias: {type: Number},
        rate_descent_fpm: {type: Number}
    },

    //LANDING PERFORMANCE
    performance_landing: 
    {
        conditions: [{type: String}],
        speed_50ft: {type: Number},
        ground_roll_landing: {type: Number},
        total_distance_50ft: {type: Number}
    },

})

export default model('Airplane', AirplaneSchema);