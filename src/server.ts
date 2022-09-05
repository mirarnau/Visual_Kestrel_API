import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoose from 'mongoose';
import compression from 'compression';
import cors from 'cors';
import dotenv from "dotenv";

import indexRoutes from './routes/indexRoutes';
import userRoutes from './routes/usersRoutes';
import adminRoutes from './routes/adminRoutes';


dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });
dotenv.config({ path: ".env.secret" });

class Server {
    public app: express.Application;

    

    //The contructor will be the first code that is executed when an instance of the class is declared.
    constructor(){
        this.app = express();
        this.config();
        this.routes();
    }

    config() {
        //MongoDB settings
        let DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/VISUAL_KESTREL';

        DB_URL = DB_URL.replace("user", process.env.DB_USER!);
        DB_URL = DB_URL.replace("password", process.env.DB_PASSWORD!);

        mongoose.connect(DB_URL).then(db => console.log("DB is connected"));

        //Settings
        this.app.set('port', process.env.PORT || 3000); 

        //Middlewares
        this.app.use(morgan('dev')); //Allows to see by console the petitions that eventually arrive.
        this.app.use(express.json()); //So that Express parses JSON as the body structure, as it doens't by default.
        this.app.use(express.urlencoded({extended:false}));
        this.app.use(helmet()); //Offers automatically security in front of some cracking attacks.
        this.app.use(compression()); //Allows to send the data back in a compressed format.
        this.app.use(cors()); //It automatically configures and leads with CORS issues and configurations.
    }

    routes() {
        this.app.use(indexRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/admins', adminRoutes);
    }

    start() {
        this.app.listen(this.app.get('port'), () =>{
            console.log ('Server listening on port', this.app.get('port'));
        });
    }
}

const server = new Server(); 
server.start()