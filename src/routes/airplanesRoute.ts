import {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import Airplane from '../models/Airplane';



class AirplaneRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getAllAirplanes(req: Request, res: Response) : Promise<void> { 
        const allAirplanes = await Airplane.find();
        if (allAirplanes.length == 0) {
            res.status(404).send("There are no airplanes yet.")
        }
        else{
            res.status(200).send(allAirplanes);
        }
    }

    public async getAirplaneById (req: Request, res: Response) : Promise<void> { 
        const airplaneFound = await Airplane.findById(req.params._id);
        if (airplaneFound == null) {
            res.status(404).send("Airplane not found")
        }
        else{
            res.status(200).send(airplaneFound);
        }
    }
  
    
    public async addAirplane(req: Request, res: Response) : Promise<void>  {
        let body = req.body;
        let performance_takeof_data = {
            conditions: body.performance_climb.conditions,
            mtow: body.performance_climb.mtow,
            ground_roll_takeoff: body.performance_takeof.ground_roll_takeoff,
            total_distance_50ft: body.performance_takeof.total_distance_50ft,
            takeof_ias: body.performance_takeof.takeof_ias
        };
        let performance_climb_data = [{}];
        for (let i = 0; i < body.performance_climb.data.length; i++){
            performance_climb_data.push(
                {
                    pressure_altitude: body.performance_climb.data[i].pressure_altitude,
                    temp_celsius: body.performance_climb.data[i].temp_celsius,
                    climb_speed_kias: body.performance_climb.data[i].climb_speed_kias,
                    time_minutes: body.performance_climb.data[i].time_minutes,
                    fuel_used_gallons: body.performance_climb.data[i].fuel_used_gallons,
                    distance_nm: body.performance_climb.data[i].distance_nm
                }
            );
        }
        let performance_cruise_data = [{}];
        for (let i = 0; i < body.performance_cruise.data.length; i++){
            performance_cruise_data.push(
                {
                    pressure_altitude: body.performance_cruise.data[i].pressure_altitude,
                    bhp_percentage: body.performance_cruise.data[i].bhp_percentage,
                    ktas: body.performance_cruise.data[i].ktas,
                    ghp: body.performance_cruise.data[i].ghp
                }
            )
        }

        let performance_descent_data = {
            level_to_descend_ft: body.performance_descent.level_to_descend_ft,
            kias: body.performance_descent.kias,
            rate_descent_fpm: body.performance_descent.rate_descend_fpm,
        }

        let performance_approach_data = {
            kias: body.performance_approach.kias,
            rate_descent_fpm: body.performance_approach.rate_descent_fpm
        }

        let performance_landing_data = {
            conditions: body.performance_landing.conditions,
            speed_50ft: body.performance_landing.speed_50ft,
            ground_roll_landing: body.performance_landing.ground_roll_landing,
            total_distance_50ft: body.performance_landing.total_distance_50ft
        }

        let newAirplanes = new Airplane(
            {
                model : body.model,
                weight_empty: body.weight_empty,
                recat_eu: body.recat_eu,
                rpm_average: body.rpm_average,
                fuelCapacity: body.fuelCapacity,
                ceiling: body.ceiling,
                performance_takeof: performance_takeof_data,
                performance_climb: 
                {
                    data: performance_climb_data,
                    conditions: body.performance_climb.conditions
                },
                performance_cruise: 
                {
                    data: performance_cruise_data,
                    conditions: body.performance_cruise.conditions

                },
                performance_approach: performance_approach_data,
                performance_descent: performance_descent_data,
                performance_landing: performance_landing_data
            }
        );

        await newAirplanes.save();
        res.status(200).send("Airplane " + body.model + " created.")
    }


    routes() {
        this.router.get('/', this.getAllAirplanes);
        this.router.get('/:_id', this.getAirplaneById);
        this.router.post('/', this.addAirplane); 

    }
}
const airplanesRoutes = new AirplaneRoutes();

export default airplanesRoutes.router;