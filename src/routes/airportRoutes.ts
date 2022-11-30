import {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import Airport from '../models/Airport';



class AirportRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getAllAirports(req: Request, res: Response) : Promise<void> { //It returns a void, but internally it's a promise.
        const allAirports = await Airport.find();
        if (allAirports.length == 0) {
            res.status(404).send("There are no airports yet.")
        }
        else{
            res.status(200).send(allAirports);
        }
    }
  
    
    public async addAirports(req: Request, res: Response) : Promise<void>  {
        let counter = 0;

        for (var key in req.body){
            var currentAirport = req.body[key];
            console.log(currentAirport);
            if (currentAirport.country == 'ES'){
                const newAirsport = new Airport(
                    {
                        name: currentAirport.name,
                        city: currentAirport.city,
                        country: currentAirport.country,
                        community: currentAirport.state,
                        timezone: currentAirport.tz,
                        elevation: currentAirport.elevation,
                        iata_code: currentAirport.iata,
                        icao_code: currentAirport.icao,
                        coordinates: {
                            lat: currentAirport.lat,
                            long: currentAirport.lon,
                        }
                    }
                )   
                counter++;
                await newAirsport.save();
            }

        }

        res.status(200).send(counter.toString() + ' airports have been added');
    }


    public async deleteAirport(req: Request, res: Response) : Promise<void> {
        const airportToDelete = await Airport.findByIdAndDelete (req.params._id);
        if (airportToDelete == null){
            res.status(404).send("Airport not found.")
        }
        else{
            res.status(200).send('Airport deleted.');
        }
    } 

    routes() {
        this.router.get('/', this.getAllAirports);
        this.router.post('/', this.addAirports); 
        this.router.delete('/:_id', [authJwt.VerifyTokenCustomer], this.deleteAirport);

    }
}
const airportsRoutes = new AirportRoutes();

export default airportsRoutes.router;