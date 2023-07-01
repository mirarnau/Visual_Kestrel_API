import {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import Airplane from '../models/Airplane';
import Route from '../models/Route';
import { type } from 'os';
import { Console, time } from 'console';
import https from 'https';
import fetch from 'node-fetch';
import { TextDecoder } from 'util';
import Airspace from '../models/Airspace';



class RoutesRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); 
    }

    public async getAllRoutes(req: Request, res: Response) : Promise<void> { 
        const allRoutes = await Route.find();
        if (allRoutes.length == 0) {
            res.status(404).send("There are no routes yet.")
        }
        else{
            res.status(200).send(allRoutes);
        }
    }

    public async getRoutesByUserId(req: Request, res: Response) : Promise<void> {
        const routesFound = await Route.find({user: req.params._id});
        if (routesFound.length == 0) {
            res.status(404).send("No routes found.")
        }
        else{
            res.status(200).send(routesFound);
        }
    }


    public async getRouteAltitudes(req: Request, res: Response) : Promise<void> {
        var points : any[] = [];
        for (let i = 0; i < req.body.listPoints.length; i++){
            points.push(
                {
                    lat: req.body.listPoints[i].lat,
                    long: req.body.listPoints[i].long
                }
            );
        }

        var listSections = await processSectionsRoute(points);
        var listSectionsCorrectedFl = firstCorrection(listSections);

        // HERE IS WHERE I MUST CALL THE AIRSPACE EVALUATION METHOD TO VALIDATE THE ROUTE 
    
        const airspaceClassA = await Airspace.findOne({airspaceClass: "CLASS A"});
        const airspaceProhibited = await Airspace.findOne({airspaceClass: "PROHIBITED"});
        const airspaceRestricted = await Airspace.findOne({airspaceClass: "RESTRICTED"});

        var routePointsCoordinates : any[] = [];
        for (let u = 0; u < listSectionsCorrectedFl.length; u++){
            var currentSection = listSectionsCorrectedFl[u];
            for (let p = 0; p < currentSection.length; p++){
                var currentPointSection = currentSection[p];
                routePointsCoordinates.push(currentPointSection);
            }
        }

        var intersectionVectorClassA = await isAnyPointInsidePolygons(routePointsCoordinates, airspaceClassA?.polygones, "CLASS A");
        var intersectionVectorProhibited = await isAnyPointInsidePolygons(routePointsCoordinates, airspaceProhibited?.polygones, "PROHIBITED");
        var intersectionVectorRestricted = await isAnyPointInsidePolygons(routePointsCoordinates, airspaceRestricted?.polygones, "RESTRICTED");

        var listsResponse = [listSectionsCorrectedFl, intersectionVectorClassA, intersectionVectorProhibited, intersectionVectorRestricted];

        res.status(200).send(listsResponse);

        function delay(ms: number) {
            return new Promise( resolve => setTimeout(resolve, ms) );
        }


        async function isAnyPointInsidePolygons(route, listPolygonesAirspaces, name) {
            var intersectingPoints : any[] = []; // 0 when not intersectiong, the airspace boundaries when true
            for (let i = 0; i < route.length; i++) {
                var currentPointRoute = route[i];
                var lowestBase = Infinity;
                var highestTop = 0;
                var inside = false;
                for (let y = 0; y < listPolygonesAirspaces.length; y++) {
                    var currentPolygonePoints = listPolygonesAirspaces[y].points;
                    if (isPointInsidePolygon(currentPointRoute, currentPolygonePoints)) {
                        console.log("TRUE for " + name);
                        inside = true;
                        var polygonBase = await parseAltiudeData(currentPolygonePoints[0].base);
                        var polygonTop = await parseAltiudeData(currentPolygonePoints[0].top);
                        if(polygonBase < lowestBase){
                            lowestBase = polygonBase;
                        }
                        if (polygonTop > highestTop){
                            highestTop = polygonTop;
                        }  
                    }
                }
                if (inside){
                    var airspaceBoundariesData = {
                        base: lowestBase,
                        top: highestTop
                    }
                    console.log(airspaceBoundariesData);
                    intersectingPoints.push(airspaceBoundariesData);
                }
                else{
                    var airspaceBoundariesData = {
                        base: 0,
                        top: 0
                    }
                    intersectingPoints.push(airspaceBoundariesData);
                }
            }
            return intersectingPoints;
          }

        function isPointInsidePolygon(point, listPointsPolygone): boolean {
            let isInside = false;
            const [pointLat, pointLong] = [point.lat, point.long];
          
            for (let i = 0, j = listPointsPolygone.length - 1; i < listPointsPolygone.length; j = i++) {
              const [vertiLat, vertiLong] = [listPointsPolygone[i].coordinates.lat, listPointsPolygone[i].coordinates.long];
              const [vertjLat, vertjLong] = [listPointsPolygone[j].coordinates.lat, listPointsPolygone[j].coordinates.long];
          
              if (
                ((vertiLong > pointLong) !== (vertjLong > pointLong)) &&
                (pointLat < ((vertjLat - vertiLat) * (pointLong - vertiLong)) / (vertjLong - vertiLong) + vertiLat)
              ) {
                // Before switching to true, here carry out the vertical check. An extra AND is needed
                isInside = !isInside;
              }
            }
          
            return isInside;
          }

        async function parseAltiudeData(altitudeData: string) {
            var splittedData = altitudeData.split(" ");
            
            if (splittedData.length == 1){
                if (splittedData[0] == "GND") {
                    // CASE 4 Format -> GND
                    // Just check the upper boundary, because it's impossible to fly under the ground.
                    console.log("CASE 4 Output -> 0");
                    return 0;
                }
                else{
                    // CASE 1 Format -> FL123
                    var flightLevel = splittedData[0].split("FL")[1];
                    console.log(flightLevel);
                    console.log("CASE 1 Output -> " + parseFloat(flightLevel) * 100);
                    return parseFloat(flightLevel) * 100;
                }
            }
            else{
                var flightLevelFeets = splittedData[0];
                var reference = splittedData[2];

                if ((reference == "AMSL") || (reference == "MSL")){
                    // CASE 2 Format -> 1234 FT AMSL
                    console.log("CASE 2 Output -> " + parseFloat(flightLevelFeets));
                    return parseFloat(flightLevelFeets);
                }
                else{
                    // CASE 3 Format -> 1234 FT AGL
                    // Here API request, no other option.
                    console.log("CASE 3 Output -> " + parseFloat(flightLevelFeets));
                    return parseFloat(flightLevelFeets);
                }
            }

        }
        
        async function processSectionsRoute(listPoints)  {
            var listSectionsWithElevation : any [] = [];
            for (let i = 0; i < (listPoints.length - 1); i++){
                var currentSection = interpolatePoints(listPoints[i].lat, listPoints[i].long, listPoints[i+1].lat, listPoints[i+1].long);
                var sectionWithElevation = await requestElevation(currentSection);
                await delay(1300); // 1 second delay to comply with less than 1 req / sec of the free Open Topo Data API
                listSectionsWithElevation.push(sectionWithElevation);
            }
            return listSectionsWithElevation;
        } 


        function interpolatePoints(latOrigin, longOrigin, latDest, longDest){
            var delta_lat = latDest - latOrigin;
            var delta_long = longDest - longOrigin;
            var interpolatedSection: any[] = [];
            //20 points/section interpolation (API accepts a max of 100 points)
            for (let t = 0; t <= 1; t = t + 0.05){
                var newPoint = {
                    lat: latOrigin + (t * delta_lat),
                    long: longOrigin + (t * delta_long)
                };
                interpolatedSection.push(newPoint);
            }
            return interpolatedSection;
        }
        

        async function requestElevation (section){
            //let url = "https://api.open-elevation.com/api/v1/lookup"
            let url = "https://api.opentopodata.org/v1/eudem25m?locations="
            var pointsSectionWithElevation: any[] = [];

            for (let i = 0; i < section.length; i++){
                url = url + section[i].lat + "," + section[i].long + "|";
            }

            /*
            var listLocations: any [] = [];
            for (let i = 0; i < section.length; i++){
                var location = {
                    "latitude": section[i].lat,
                    "longitude": section[i].long
                }
                listLocations.push(location);
            }
            var bodyJson =   {"locations": listLocations};
            */

            const response = await fetch(url, {
                method: 'get',
                //body: JSON.stringify(bodyJson),
                headers: {'Accept': 'application/json', 'Content-Type':' application/json'} });

            const data = await response.json();

            if (data !== null) {
                console.log(data.error);

                for (let i = 0; i < data.results.length; i++){
                    var pointWithAltitude = {
                        lat: data.results[i].location.lat,
                        long: data.results[i].location.lng,
                        elevation: data.results[i].elevation,
                        flight_level: decideFlightLevel(data.results[i].elevation, computeBearing(data.results[i].location.lat, data.results[i].location.lng, data.results[data.results.length - 1].location.lat, data.results[data.results.length - 1].location.lng ))
                    }
                    pointsSectionWithElevation.push(pointWithAltitude);
                }
                return pointsSectionWithElevation;
            }
        }

        function computeBearing(latOringin, longOrigin, latDest, longDest){
            var y = Math.sin(longDest - longOrigin) * Math.cos(latDest);
            var x = Math.cos(latOringin)*Math.sin(latDest) -
                    Math.sin(latOringin)*Math.cos(latDest)*Math.cos(longDest-longOrigin);
            var bearing = Math.atan2(y, x) * 180 / Math.PI;
            return bearing;
        }

        function decideFlightLevel(pointElevation, bearingDegrees){
            var minDistance = pointElevation + 1000;
            if ((bearingDegrees >= 270) && (bearingDegrees <= 89)){
                var found : boolean = false;
                var guess = 2500;
                while (!found){
                    var difference = guess - minDistance;
                    if (difference > 0){
                        found = true;
                    }
                    else{
                        guess = guess + 2000;
                    }
                    
                }
                return guess;
            }  
            else {
                var found : boolean = false;
                var guess = 1500;
                while (!found){
                    var difference = guess - minDistance;
                    if (difference > 0){
                        found = true;
                    }
                    else{
                        guess = guess + 2000;
                    }
                    
                }
                return guess;
            } 
            
        }

        //Max altitude in the section
        function firstCorrection(listSectionsWithElevation){
            var listSectionsWithCorrectedAltitudes: any[] = [];
            for (let i = 0; i < listSectionsWithElevation.length; i++){
                var sectionWithCorrectedAltitudes: any[] = [];
                var currentSection = listSectionsWithElevation[i]; //It has 80 points
                var maximumFlSection = 0;
                for (let k = 0; k < currentSection.length; k++){
                    if (currentSection[k].flight_level > maximumFlSection){
                        maximumFlSection = currentSection[k].flight_level;
                    }
                }
                for (let r = 0; r < currentSection.length; r++){
                    var correctedPoint = {
                        lat: currentSection[r].lat,
                        long: currentSection[r].long,
                        elevation: currentSection[r].elevation ,
                        flight_level: maximumFlSection
                    }
                    sectionWithCorrectedAltitudes.push(correctedPoint);
                }
                listSectionsWithCorrectedAltitudes.push(sectionWithCorrectedAltitudes);
            }
            return listSectionsWithCorrectedAltitudes;
        }

    }

    //Given a list of sections
    public async getFullReportRoute(req: Request, res: Response) : Promise<void> { 
        const airplaneId = req.params.idAirplane;
        const airplaneUsed = await Airplane.findOne({_id: airplaneId});
        if (airplaneUsed == null){
            res.status(404).send("Airplane not found");
            return;
        }
        let listSections : any[]  = [];
        for (let i = 0; i < req.body.data.length; i++){
            listSections.push(req.body.data[i]);
        }

        let listReports : any[] = [];
        listReports.push(getTakeoffReport(airplaneUsed));

        var currentAltitudeFt = 0;
        for (let i = 0; i < listSections.length; i++){
            var currentSection = listSections[i];
            var firstPointSection = currentSection[0];
            var lastPointSection = currentSection[currentSection.length - 1];
            if (firstPointSection.flight_level > currentAltitudeFt){
                //Then a climb will happen
                listReports.push(getClimbReport(airplaneUsed, currentAltitudeFt, firstPointSection.flight_level));
                currentAltitudeFt = firstPointSection.flight_level;
            }   
            if (firstPointSection.flight_level < currentAltitudeFt){
                //Then a descent will happen
                listReports.push(getDescentReport(airplaneUsed, currentAltitudeFt, firstPointSection.flight_level));
                currentAltitudeFt = firstPointSection.flight_level;
            }
            if (firstPointSection.flight_level == currentAltitudeFt){
                //Then a cruise will happen
                listReports.push(getCruiseReport(airplaneUsed, currentAltitudeFt, firstPointSection, lastPointSection));
                currentAltitudeFt = firstPointSection.flight_level;
            }
        }
        listReports.push(getApproachReport(airplaneUsed));
        listReports.push(getLandingReport(airplaneUsed));

        res.status(200).send(listReports);

        function computeBearing(latOringin, longOrigin, latDest, longDest){
            latOringin = latOringin * Math.PI / 180;
            longOrigin = longOrigin * Math.PI / 180;
            latDest = latDest * Math.PI / 180;
            longDest = longDest * Math.PI / 180;
            var y = Math.sin(longDest - longOrigin) * Math.cos(latDest);
            var x = Math.cos(latOringin)*Math.sin(latDest) -
                    Math.sin(latOringin)*Math.cos(latDest)*Math.cos(longDest-longOrigin);
            var bearing = Math.atan2(y, x) * 180 / Math.PI;
            return bearing;
        }

        function getTakeoffReport(airplane){
            var totalDistance = airplane.performance_takeof.ground_roll_takeoff + airplane.performance_takeof.total_distance_50ft  
            var takeoffKias = airplane.performance_takeof.takeof_ias  
            var totalTakeoffTime = (totalDistance * 0.3048) / (takeoffKias * 0.514444444); //seconds
            var conditionsTakeoff = airplane.performance_takeof.conditions;
            var responseTakeoff = {
                report_type: 'Takeoff',
                takeoff_total_distance_ft: totalDistance,
                takeoff_total_distance_m: totalDistance * 0.3048,
                takeoff_kias_kt: takeoffKias,
                takeoff_kias_mps: takeoffKias * 0.514444444,
                time: totalTakeoffTime,
                conditions_takeoff: conditionsTakeoff
            };
            return responseTakeoff;
        }

        //Generic function to calculate climbing times between two flight levels.
        function getClimbReport(airplane, originalAltitude, finalAltitude){
            var altitudeToClimb = finalAltitude - originalAltitude; //ft
            function findClosestDataIndex(airplane, differenceAltitudes){
                var minimum = Infinity;
                var index;
                for (let i = 1; i < airplane.performance_climb.data.length; i++){
                    var currentAltitude = airplane.performance_climb.data[i].pressure_altitude;
                    var difference = Math.abs(differenceAltitudes - currentAltitude);
                    if (difference < minimum){
                        minimum = difference;
                        index = i;
                    }
                }
                return index;
            }
            var indexToEvaluate = findClosestDataIndex(airplane, altitudeToClimb);

            var rateClimbFpm =  airplane.performance_climb.data[indexToEvaluate].rate_climb_fpm;
            var timeClimbingSeconds = altitudeToClimb / (rateClimbFpm / 60) //seconds
            var climbSpeedKias = airplane.performance_climb.data[indexToEvaluate].climb_speed_kias;
            var fuelUsedGallons = airplane.performance_climb.data[indexToEvaluate].fuel_used_gallons;
            var responseClimb = {
                report_type: 'Climb',
                climb_difference_ft: altitudeToClimb,
                rate_climb_fpm: rateClimbFpm,
                time: timeClimbingSeconds,
                climb_speed_kias: climbSpeedKias,
                fuel_used_gallons: fuelUsedGallons,
            }
            return responseClimb;
        }

        function getCruiseReport(airplane, cruiseAltitude, pointOrigin, pointDestination){
            function findClosestDataIndex(airplane, altitude){
                var minimum = Infinity;
                var index;
                for (let i = 1; i < airplane.performance_cruise.data.length; i++){
                    var currentAltitude = airplane.performance_cruise.data[i].pressure_altitude;
                    var difference = Math.abs(altitude - currentAltitude);
                    if (difference < minimum){
                        minimum = difference;
                        index = i;
                    }
                }
                return index;
            }

            function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLon = deg2rad(lon2-lon1); 
                var a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2)
                  ; 
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                var d = R * c; // Distance in km
                return d;
            }

            function deg2rad(deg) {
                return deg * (Math.PI/180)
            }

            var indexToEvaluate = findClosestDataIndex(airplane, cruiseAltitude);
            var conditions = airplane.performance_cruise.conditions;
            var altitude = cruiseAltitude;
            var bphPercentage = airplane.performance_cruise.data[indexToEvaluate].bhp_percentage;
            var ktas = airplane.performance_cruise.data[indexToEvaluate].ktas;
            var distanceCruiseKm = getDistanceFromLatLonInKm(pointOrigin.lat, pointOrigin.long, pointDestination.lat, pointDestination.long);
            var timeCruiseSeconds = (distanceCruiseKm * 1000) / (ktas * 0.514444444) //seconds
            var bearing = computeBearing(pointOrigin.lat, pointOrigin.long, pointDestination.lat, pointDestination.long)
            var responseCruise = {
                report_type: 'Cruise',
                conditions: conditions,
                altitude_cruise_ft: altitude,
                bph_percentage: bphPercentage,
                cruise_ktas: ktas,
                distance_cruise_km: distanceCruiseKm,
                time: timeCruiseSeconds,
                bearing: bearing
            }
            return responseCruise;
        }


        //Generic function to calculate descending times between two flight levels.
        function getDescentReport(airplane, originalAltitude, finalAltitude){
            var altitudeToDescentFt = originalAltitude - finalAltitude; //ft
            var descentKias = airplane.performance_descent.kias; 
            var timeDescent = (altitudeToDescentFt * 0.3048) / (descentKias * 0.514444444); //seconds
            var responseDescent = {
                report_type: 'Descent',
                descent_difference_ft: altitudeToDescentFt,
                descent_kias: descentKias,
                time: timeDescent
            }
            return responseDescent;  
        }

        function getApproachReport(airplane){
            var approachKias = airplane.performance_approach.kias;
            var rateDescentFpm = airplane.performance_approach.rate_descent_fpm;
            var responseApproach = {
                report_type: 'Approach',
                approach_kias: approachKias,
                approach_kias_mps: approachKias * 0.514444444,
                rate_descent_fpm: rateDescentFpm
            }
            return responseApproach;
        }

        function getLandingReport(airplane){
            var conditionsLanding = airplane.performance_landing.conditions;
            var speed50Ft = airplane.performance_landing.speed_50ft;
            var groundRollLanding = airplane.performance_landing.ground_roll_landing;
            var totalDistance50Ft = airplane.performance_landing.total_distance_50ft;
            var responseLanding = {
                report_type: 'Landing',
                conditions_landing: conditionsLanding,
                speed_50ft: speed50Ft,
                speed_50ft_mps: speed50Ft * 0.514444444,
                ground_roll_landing_ft: groundRollLanding,
                ground_roll_landing_m: groundRollLanding * 0.3048,
                total_distance_50ft: totalDistance50Ft,
            }
            return responseLanding;
        }
    }

    
    public async addRoute(req: Request, res: Response) : Promise<void>  {
        let waypointList : any[]  = [];
        for (let i = 0; i < req.body.listWayPoints.length; i ++){
            function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLon = deg2rad(lon2-lon1); 
                var a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2)
                  ; 
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                var d = R * c; // Distance in km
                return d;
              }
              function deg2rad(deg) {
                return deg * (Math.PI/180)
              }

            
            function previousDistance() {
                if (i != 0){
                    let lat1 = req.body.listWayPoints[i-1].coordinates.lat;
                    let lon1 = req.body.listWayPoints[i-1].coordinates.long;
                    let lat2 = req.body.listWayPoints[i].coordinates.lat;
                    let lon2 = req.body.listWayPoints[i].coordinates.long;
                    const distance = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
                    return distance;   
                    }    
                    else{
                        return '0';
                    }
            }
            waypointList.push(
                {
                    pointName: req.body.listWayPoints[i].pointName,
                    comments: req.body.listWayPoints[i].comments,
                    distance_previous: previousDistance(),
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
        await newRoute.save();
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

    //Given 2 points
    public async getAnalyticsVisibility(req: Request, res: Response) : Promise<void> { 
        let originPoint = req.body.origin;
        let destinationPoint = req.body.destination;
        let condition = req.body.condition;
        
        function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2-lat1);  // deg2rad below
            var dLon = deg2rad(lon2-lon1); 
            var a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2)
              ; 
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            var d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }

        function getNewCoordinates(lat1, lon1, distanceOriginDest, bearing){
            var lat1_rad = deg2rad(lat1);
            var lon1_rad = deg2rad(lon1);
            var radiusEarth = 6378.1;
            var distanceKm = distanceOriginDest / 2;

            var lat2_rad =  Math.asin( Math.sin(lat1_rad)*Math.cos(distanceKm/radiusEarth) +
            Math.cos(lat1_rad)*Math.sin(distanceKm/radiusEarth)*Math.cos(bearing));
            var lon2_rad = lon1_rad + Math.atan2(Math.sin(bearing)*Math.sin(distanceKm/radiusEarth)*Math.cos(lat1_rad),
            Math.cos(distanceKm/radiusEarth)-Math.sin(lat1_rad)*Math.sin(lat2_rad));

            var lat2 = lat2_rad * (180.0 / Math.PI);
            var lon2 = lon2_rad * (180.0 / Math.PI);

            var newPoint = {
                lat: lat2,
                long: lon2
            }

            return newPoint;
        }

        //Returns bearing in degrees
        function computeBearing(latOringin, longOrigin, latDest, longDest){
            latOringin = deg2rad(latOringin);
            longOrigin = deg2rad(longOrigin);
            latDest = deg2rad(latDest);
            longDest = deg2rad(longDest);

            var y = Math.sin(longDest - longOrigin) * Math.cos(latDest);
            var x = Math.cos(latOringin)*Math.sin(latDest) -
                    Math.sin(latOringin)*Math.cos(latDest)*Math.cos(longDest-longOrigin);
            var bearing = Math.atan2(y, x) * 180 / Math.PI;
            return bearing;
        }

        //Interpolation to create the points network
        function interpolatePointsNetwork(latOrigin, longOrigin, latDest, longDest){
            var delta_lat = latDest - latOrigin;
            var delta_long = longDest - longOrigin;
            var interpolatedRow: any[] = [];
            //4 points/row interpolation
            for (let t = 0; t <= 1; t = t + 0.25){
                var newPoint = {
                    lat: latOrigin + (t * delta_lat),
                    long: longOrigin + (t * delta_long),
                };
                interpolatedRow.push(newPoint);
            }
            return interpolatedRow;
        }

        function transpose(matrix) {
            return matrix.reduce((prev, next) => next.map((item, i) =>
              (prev[i] || []).concat(next[i])
            ), []);
          }

        async function getWeatherReport(lat, long, time) {
            const KEY = process.env.WEATHER_SECRET;
            let url = "https://api.openweathermap.org/data/3.0/onecall?lat=" + lat + "&lon=" + long + "&exclude=minutely&appid=" + KEY;

            const response = await fetch(url, {
                method: 'get',
                headers: {'Accept': 'application/json', 'Content-Type':' application/json'} });

            const data = await response.json();

            if (data != null) {
                let wantedForecast;
                let wantedTimeStamp = time;
                let minDifference = Infinity;

                let hourlyDailyForecast = data.hourly.concat(data.daily);
                //let hourlyDailyForecast = data.hourly;
                //console.log(hourlyDailyForecast);
                
                for (let i = 0; i < hourlyDailyForecast.length; i++){
                    let difference = Math.abs(hourlyDailyForecast[i].dt - wantedTimeStamp);
                    if (difference < minDifference){
                        minDifference = difference;
                        if (condition == "Minimum wind speed"){
                            wantedForecast = hourlyDailyForecast[i].wind_speed;
                        }
                        if (condition == "Less clouds"){
                            wantedForecast = hourlyDailyForecast[i].clouds;
                        }
                        
                    }
                }
                
                return wantedForecast;
            }
            else{
                return 0;
            }
        }

        var matrixEdges = 
        [
            [getNewCoordinates(originPoint.lat, originPoint.long, getDistanceFromLatLonInKm(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) , (computeBearing(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) - 90) * (Math.PI / 180)), 
                getNewCoordinates(destinationPoint.lat, destinationPoint.long, getDistanceFromLatLonInKm(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) , (computeBearing(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) - 90) * (Math.PI / 180))],
            [getNewCoordinates(originPoint.lat, originPoint.long, getDistanceFromLatLonInKm(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) , (computeBearing(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) + 90) * (Math.PI / 180)), 
                getNewCoordinates(destinationPoint.lat, destinationPoint.long, getDistanceFromLatLonInKm(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) , (computeBearing(originPoint.lat, originPoint.long, destinationPoint.lat, destinationPoint.long) + 90) * (Math.PI / 180))],
        ]

        let rowsList : any[]  = [];
        for (let i = 0; i < matrixEdges.length; i++){
            let pointsRowList : any[] = [];
            var currentRow = matrixEdges[i];
            for (let k = 0; k < currentRow.length; k++){
                pointsRowList.push(currentRow[k]);
            }
            rowsList.push(pointsRowList);
        }

        //First we do the rows interpolation
        let rowsInterpolatedList : any[] = [];
        for (let i = 0; i < rowsList.length; i++){
            var evaluatedRow = rowsList[i];
            var interpolatedRow = interpolatePointsNetwork(evaluatedRow[0].lat, evaluatedRow[0].long, evaluatedRow[1].lat, evaluatedRow[1].long);
            rowsInterpolatedList.push(interpolatedRow);
        }

        //And now the columns
        let columnsInterpolatedList : any[] = [];
        for (let i = 0; i < rowsInterpolatedList[0].length; i++){
            var originColumn = rowsInterpolatedList[0][i];
            var destinationColumn = rowsInterpolatedList[1][i];
            var interpolatedColumn = interpolatePointsNetwork(originColumn.lat, originColumn.long, destinationColumn.lat, destinationColumn.long);
            columnsInterpolatedList.push(interpolatedColumn);
        }
        var finalMatrix = transpose(columnsInterpolatedList);


        //The algorithm starts here
        var orginPoint = finalMatrix[2][0];
        var destPoint = [2,4];
        var currentPoint = [2,0];

        var listSelectedPoints : any[] = [];
        var listSelectedCoordinates : [any[]] = [[]];

        listSelectedCoordinates.push([2,0])
        listSelectedPoints.push({
            lat: finalMatrix[2][0].lat,
            long: finalMatrix[2][0].long
        });   

        var destinationReached = false;

        while(!destinationReached){
            console.log('CURRENT POINT: ' + currentPoint);
            var potentialNextHops : any[] = [];
            if (currentPoint[0] == 0){
                if (currentPoint[1] == 0){
                    potentialNextHops.push([1, 1]);
                    potentialNextHops.push([0, 1]);
                }
                else if (currentPoint[1] == 4){
                    potentialNextHops.push([1, 4]);
                }
                else{
                    potentialNextHops.push([0, currentPoint[1] + 1]); //Right point
                    potentialNextHops.push([1, currentPoint[1] + 1]); //Bottom right point
                    potentialNextHops.push([1, currentPoint[1]]); //Botom point
                }
            }
            else if (currentPoint[0] == 4){
                if (currentPoint[1] == 0){
                    potentialNextHops.push([4, 1]);
                    potentialNextHops.push([3, 1]);
                }
                else if (currentPoint[1] == 4){
                    potentialNextHops.push([3, 4]);
                }
                else{
                    potentialNextHops.push([4, currentPoint[1] + 1]); //Right point
                    potentialNextHops.push([3, currentPoint[1] + 1]); //Top right point
                    potentialNextHops.push([3, currentPoint[1]]); //Top point
                }
            }
            else{
                if (currentPoint[1] == 4){
                    potentialNextHops.push([2, 4]);
                }
                else if (currentPoint[1] == 3){
                    if (currentPoint[0] == 1){
                        potentialNextHops.push([2, 4]); //Destination point
                        potentialNextHops.push([1, 4]); //Right point
                    }
                    else if (currentPoint[0] == 2){
                        potentialNextHops.push([2, 4]); //Destination point
                    }
                    else if (currentPoint[0] == 3){
                        potentialNextHops.push([2, 4]); //Destination point
                        potentialNextHops.push([3, 4]);
                    }

                }
                else{
                    potentialNextHops.push([currentPoint[0], currentPoint[1] + 1]); //Right point
                    potentialNextHops.push([currentPoint[0] - 1, currentPoint[1] + 1]); //Top right point
                    potentialNextHops.push([currentPoint[0] + 1, currentPoint[1] + 1]); //Bottom right point
                    potentialNextHops.push([currentPoint[0] - 1, currentPoint[1]]); //Top point
                    potentialNextHops.push([currentPoint[0] + 1, currentPoint[1]]); //Bottom point
                }
            }
            var minCondition = Infinity;
            var nextHopGuess = potentialNextHops[0]; //First guess
            
            for (var i = 0; i < potentialNextHops.length; i++){
                console.log(potentialNextHops[i]);
                var evaluatedCondition = await getWeatherReport(finalMatrix[potentialNextHops[i][0]][potentialNextHops[i][1]].lat, finalMatrix[potentialNextHops[i][0]][potentialNextHops[i][1]].long ,1669499789);
                //var windSpeed = 0;
                if ((evaluatedCondition <= minCondition) && (potentialNextHops[i][0] != listSelectedCoordinates[listSelectedCoordinates.length - 1][0]) && (potentialNextHops[i][1] != listSelectedCoordinates[listSelectedCoordinates.length - 1][1])){
                    minCondition = evaluatedCondition;
                    nextHopGuess = potentialNextHops[i];
                }
            }
            listSelectedPoints.push({
                lat: finalMatrix[nextHopGuess[0]][nextHopGuess[1]].lat,
                long: finalMatrix[nextHopGuess[0]][nextHopGuess[1]].long
            });    
            listSelectedCoordinates.push(nextHopGuess);
            
            currentPoint = nextHopGuess;
            if ((currentPoint[0] == destPoint[0]) && (currentPoint[1] == destPoint[1])){
                destinationReached = true;
            }
            console.log('------')
        }


        var responseJson = {
            matrix: finalMatrix,
            route: listSelectedPoints
        }
        
        res.status(200).send(responseJson);
    }



    public async getWeightAndBalanceCessna172(req: Request, res: Response) : Promise<void> { 
        let cessnaEmptyWeigth = 625.50387823; //Kg, which is 1397 lbs
        let fuelWeigth = 56; // Kg
        let pilotWeigt = req.body.pilotWeight;
        let copilotWeigth = req.body.copilotWeight;
        let passengersWeight = req.body.passengersWeigth;
        let baggageArea1 = req.body.baggageArea1;
        let baggageArea2 = req.body.baggageArea2;

        let fullWeight = (cessnaEmptyWeigth + fuelWeigth + pilotWeigt + copilotWeigth + passengersWeight + baggageArea1 + baggageArea2) * 2.20462262; // lbs

        let momentum = (1.0062173322 * cessnaEmptyWeigth) 
                        + 1.2170833342 * fuelWeigth
                        + 0.9412941169 * (pilotWeigt + copilotWeigth)
                        + 1.8527058831 * passengersWeight
                        + 2.4166990299 * (baggageArea1 + baggageArea2);

        let momentumGraphic = (momentum * 2.20462262 * 39.3700787) / 1000 //lbs * inches / 1000

        var responseJson = {
            fullWeight: fullWeight,
            momentum: momentumGraphic,
        }
        console.log(responseJson);
        res.status(200).send(responseJson);
    }

    public async updateRoute(req: Request, res: Response) : Promise<void> {
        const routeToUpdate = await Route.findByIdAndUpdate (req.params._id, req.body);
        if(routeToUpdate == null){
            res.status(404).send("Route not found.");
        }
        else{
            res.status(201).send("Route updated.");
        }
    }

    routes() {
        this.router.get('/', this.getAllRoutes);
        this.router.get('/:_id', this.getRoutesByUserId);
        this.router.post('/', this.addRoute); 
        this.router.post('/altitudes', this.getRouteAltitudes); 
        this.router.post('/report/:idAirplane', this.getFullReportRoute); 
        this.router.post('/analytics', this.getAnalyticsVisibility);
        this.router.post('/balance/Cessna172', this.getWeightAndBalanceCessna172);
        this.router.put('/:_id', this.updateRoute);
        this.router.delete('/:_id', this.deleteRoute);

    }
}
const routesRoutes = new RoutesRoutes();

export default routesRoutes.router;