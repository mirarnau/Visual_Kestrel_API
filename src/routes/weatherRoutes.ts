import {Request, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import Airport from '../models/Airport';
import { request } from 'http';
import https from 'https';
import { send } from 'process';
import WeatherReport from '../models/WeatherReport';



class WeatherRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getWeatherByCoordinates(req : Request, res : Response ) : Promise<void> {
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

    public async getWeatherByCoordinatesAndTime(req : Request, res : Response ) : Promise<void> {
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
                    let dailyForecast = {};
                    for (var i = 0; i < json.daily.length; i++){
                        if (json.daily[i].dt == req.body.date){
                            dailyForecast = json.daily[i];
                        }
                    }

                    res.status(200).send(dailyForecast);

                    
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

    public async addReportFake(req: Request, res: Response) : Promise<void>  {
        var newReport = new WeatherReport({ daily: [req.body] });
        await newReport.save();
        res.status(200).send('Report added');
    }

    public async getReportFake(req: Request, res: Response) : Promise<void>  {
        let reportFake = await WeatherReport.findOne();
        res.status(200).send(reportFake);
    }



    routes() {
        this.router.post('/', this.getWeatherByCoordinates);
        this.router.post('/date', this.getWeatherByCoordinatesAndTime);
        this.router.post('/addfake', this.addReportFake);
        this.router.get('/getfake', this.getReportFake);
        

    }
}
const weatherRoutes = new WeatherRoutes();

export default weatherRoutes.router;