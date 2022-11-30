import {Request, response, Response, Router} from 'express';
import {authJwt} from '../middlewares/index';
import bcrypt, { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import User from '../models/User';



class UserRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes(); //This has to be written here so that the method can actually be configured when called externally.
    }

    public async getAllUsers(req: Request, res: Response) : Promise<void> { //It returns a void, but internally it's a promise.
        const allUsers = await User.find();
        if (allUsers.length == 0) {
            res.status(404).send("There are no users yet.")
        }
        else{
            res.status(200).send(allUsers);
        }
    }

    public async getUserById(req: Request, res: Response) : Promise<void> {
        const userFound = await User.findById(req.params._id);
        if(userFound == null) {
            res.status(404).send("User not found.");
        }
        else{
            res.status(200).send(userFound);
        }
    }

    public async getUserByUserName(req: Request, res: Response) : Promise<void> {
        const userFound = await User.findOne({userName: req.params.userName});
        if(userFound == null) {
            res.status(404).send("User not found.");
        }
        else{
            res.status(200).send(userFound);
        }
    }
  
    public async login(req: Request, res: Response) : Promise<void> {
        const userFound = await User.findOne({userName: req.body.userName});
        const SECRET = process.env.JWT_SECRET;
    
        if(!userFound) {
            res.status(400).json({message: "Invalid credentials"});
        }
        else {
            const matchPassword = await bcrypt.compare(req.body.password, userFound.password);
        
            if(!matchPassword) {
                res.status(401).json({token: null, message: "Invalid credentials"});
            }
            else {
                const token = jwt.sign(
                    { id: userFound._id, customerName: userFound.userName, role: userFound.role }, 
                    SECRET!, 
                    {
                    expiresIn: 3600
                    }
                );
            
                res.status(200).send({ token: token, user: userFound});
            }
        }
    }
    
    public async addUser(req: Request, res: Response) : Promise<void> {
        const userFound = await User.findOne({userName: req.body.userName})
        if (userFound != null){
            res.status(409).send("This user already exists.")
        }
        else {
            const {userName, fullName, email, password} = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            const newCustomer = new User({userName, fullName, email, password: hashed});
            const savedUser = await newCustomer.save();
          
            res.status(200).json(savedUser);
        }
    }

    public async updateUser(req: Request, res: Response) : Promise<void> {
        const userToUpdate = await User.findByIdAndUpdate (req.params._id, req.body);
        if(userToUpdate == null){
            res.status(404).send("User not found.");
        }
        else{
            res.status(201).send("User updated.");
        }
    }

    public async deleteUser(req: Request, res: Response) : Promise<void> {
        const userToDelete = await User.findByIdAndDelete (req.params._id);
        if (userToDelete == null){
            res.status(404).send("User not found.")
        }
        else{
            res.status(200).send('User deleted.');
        }
    } 

    routes() {
        this.router.get('/', this.getAllUsers);
        this.router.get('/:_id', [authJwt.VerifyTokenCustomer], this.getUserById);
        this.router.get('/name/:userName', this.getUserByUserName);
        this.router.post('/', this.addUser); 
        this.router.post('/login', this.login); 
        this.router.put('/:_id', [authJwt.VerifyTokenCustomer], this.updateUser);
        this.router.delete('/:_id', [authJwt.VerifyTokenCustomer], this.deleteUser);

    }
}
const usersRoutes = new UserRoutes();

export default usersRoutes.router;