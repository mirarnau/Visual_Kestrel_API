import e, {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import User from '../models/User';
import Airspace from '../models/Airspace';
import { getSystemErrorMap } from 'util';



class AirspaceRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); //This has to be written here so that the method can actually be configured when called externally.
    }

    public async getAllAirspaces(req: Request, res: Response) : Promise<void> { //It returns a void, but internally it's a promise.
        const allAirspaces = await Airspace.find();
        if (allAirspaces.length == 0) {
            res.status(404).send("There are no airspaces yet.")
        }
        else{
            res.status(200).send(allAirspaces);
        }
    }

    public async getMultipleAirspaceByClass(req: Request, res: Response) : Promise<void> {
        const body = req.body.airspaces;
        const listAirspaces = body.map(airspace => airspace.name);
        
        const allAirspaces = await Airspace.find();
        const filteredAirspaces = allAirspaces.filter((airspace) => {
            if (listAirspaces.includes(airspace.airspaceClass)){
                return airspace;
            }
        })
        
        /*
        let listAirspacesFound: any[]= [];

        for (let i = 0; listAirspaces.length; i++){
            let name = listAirspaces[i].name;
            console.log(name);
            let airspaceFound = await Airspace.findOne({airspaceClass: name})
            listAirspacesFound.push(airspaceFound);
        }
        */

        if (filteredAirspaces.length < listAirspaces.length){
            res.status(404).send("One or more airspaces not found")
        }
        else{
            res.status(200).send(filteredAirspaces);
        }
    }

    
  
    
    public async addAirspace(req: Request, res: Response) : Promise<void> {
        const airspace_class = req.body.name;
        let points_list;
        let polygones_list;

        points_list = [];
        polygones_list = [];


        for (let i = 0 ; i < req.body.features.length; i++){
            let feature = req.body.features[i];
            if (feature.geometry.type == "MultiPolygon"){
                for (let i = 0; i < feature.geometry.coordinates.length; i ++){ //This length is the number of multipolygons of the feature
                    let currentMultiPolygon = feature.geometry.coordinates[i]; 
                    for (let k = 0; k < currentMultiPolygon.length; k++){
                            let currentPolygon = currentMultiPolygon[k]; //This polygon has a list of coordinates
                            let listPointsPolygon : any[] = [];
                            for (let m = 0; m < currentPolygon.length; m++){ //Let's go through the list of coordinates
                                let currentCoordinates = currentPolygon[m];
                                let newPoint = {
                                    coordinates: {
                                        lat: currentCoordinates[1],
                                        long: currentCoordinates[0]
                                    }
                                }
                                listPointsPolygon.push(newPoint);
                            }
                            let newPolygon;
                            if (k == 0){ //Meaning it's the first one --> Filled
                                newPolygon = {
                                    transparent: 0,
                                    points: listPointsPolygon
                                }
                            }
                            else{
                                newPolygon = {
                                    transparent: 1,
                                    points: listPointsPolygon
                                }
                            }
                            polygones_list.push(newPolygon);
                    }
                   
                }
            }

            if (feature.geometry.type == "Polygon"){
                for (let i = 0; i < feature.geometry.coordinates.length; i++){
                    let currentPolygon = feature.geometry.coordinates[i]; //This is directly a polygon with a list of coordinates
                    let listPointsPolygon : any[] = [];
                        for (let m = 0; m < currentPolygon.length; m++){ //Let's go through the list of coordinates
                            let currentCoordinates = currentPolygon[m];
                            let newPoint = {
                                coordinates: {
                                    lat: currentCoordinates[1],
                                    long: currentCoordinates[0]
                                }
                            }
                            listPointsPolygon.push(newPoint);
                        }
                        let newPolygon = {
                            transparent: 0,
                            points: listPointsPolygon
                        }
                        polygones_list.push(newPolygon);

                }
            }

            if (feature.geometry.type == "Point"){
                points_list.push({
                    name: feature.properties.Name,
                    coordinates: {
                        long: feature.geometry.coordinates[0],
                        lat: feature.geometry.coordinates[1]
                    }
                })
            }

        }

        const newAirspace = new Airspace({airspaceClass: airspace_class, polygones: polygones_list, points: points_list });
        const savedAirspace = await newAirspace.save();
        
        res.status(200).json(savedAirspace);
        
    }

    routes() {
        this.router.get('/', this.getAllAirspaces);
        this.router.post('/multiple', this.getMultipleAirspaceByClass);
        this.router.post('/', this.addAirspace);  

    }
}
const airspaceRoutes = new AirspaceRoutes();

export default airspaceRoutes.router;