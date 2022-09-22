import {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import Airport from '../models/Airport';
import Route from '../models/Route';
import { type } from 'os';



class RoutesRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getAllRoutes(req: Request, res: Response) : Promise<void> { //It returns a void, but internally it's a promise.
        const allRoutes = await Route.find();
        if (allRoutes.length == 0) {
            res.status(404).send("There are no routes yet.")
        }
        else{
            res.status(200).send(allRoutes);
        }
    }

    public async getRouteByUserId(req: Request, res: Response) : Promise<void> { //It returns a void, but internally it's a promise.
        const routesFound = await Route.findOne({user: req.params._id});
        if (routesFound == null) {
            res.status(404).send("No routes found.")
        }
        else{
            res.status(200).send(routesFound);
        }
    }
  
    
    public async addRoute(req: Request, res: Response) : Promise<void>  {

        let waypointList : any[]  = [];
        for (let i = 0; i < req.body.listWayPoints.length; i ++){
            waypointList.push(
                {
                    pointName: req.body.listWayPoints[i].pointName,
                    coordinates: {
                        lat: req.body.listWayPoints[i].coordinates.lat,
                        long: req.body.listWayPoints[i].coordinates.long
                    }
                }
            )

        }
        const newRoute = new Route(
            {
                routeName: req.body.routeName,
                user: req.body.user,
                listWayPoints: waypointList
            }
        )
        res.status(200).send('Route added');
    }


    public async deleteRoute(req: Request, res: Response) : Promise<void> {
        const routeToDelete = await Route.findByIdAndDelete (req.params._id);
        if (routeToDelete == null){
            res.status(404).send("Route not found.")
        }
        else{
            res.status(200).send('Route deleted.');
        }
    } 

    routes() {
        this.router.get('/', this.getAllRoutes);
        this.router.get('/:_id', this.getAllRoutes);
        this.router.post('/', this.addRoute); 
        this.router.delete('/:_id', [authJwt.VerifyTokenCustomer], this.deleteRoute);

    }
}
const airportsRoutes = new RoutesRoutes();

export default airportsRoutes.router;