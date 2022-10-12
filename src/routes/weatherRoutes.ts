import {Request, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import Airport from '../models/Airport';
import { request } from 'http';
import https from 'https';
import { send } from 'process';



class WeatherRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getWeatherCoordinates(req : Request, res : Response ) : Promise<void> {
        const KEY = process.env.WEATHER_SECRET;
        let url = "https://api.openweathermap.org/data/3.0/onecall?lat=" + req.body.lat + "&lon=" + req.body.long + "&exclude=minutely&appid=" + KEY;
        
        https.get(url,(resp) => {
            let body = "";
        
            resp.on("data", (chunk) => {
                body += chunk;
            });
        
            resp.on("end", () => {
                try {
                    let json = JSON.parse(body);
                    res.status(200).send(json);

                    
                } catch (error) {
                    console.error(error.message);
                    res.status(500).send("Error");
                };
            });
        
        }).on("error", (error) => {
            console.error(error.message);
            res.status(500).send("Error");
        });
    }



    routes() {
        this.router.post('/', this.getWeatherCoordinates);

    }
}
const weatherRoutes = new WeatherRoutes();

export default weatherRoutes.router;