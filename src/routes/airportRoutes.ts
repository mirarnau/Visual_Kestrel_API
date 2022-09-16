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
        for (let i = 0; i < req.body.length; i++){
            const currentAirport = req.body[i];
            if (currentAirport.country == 'Spain'){
                const newAirsport = new Airport(
                    {
                        name: currentAirport.name,
                        city: currentAirport.city,
                        country: currentAirport.country,
                        iata_code: currentAirport.iata_code,
                        coordinates: {
                            lat: currentAirport._geoloc.lat,
                            long: currentAirport._geoloc.lng,
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