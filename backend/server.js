// importing all dependecies

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';

import storageRoutes from './routes/storageRoutes.js'

const app = express();
// middlewware
app.use(cors());
app.use(express.json());

// connecting mongo DB to server
const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongoDB connected succesfully");
    } catch (err) {
        console.error('connection Failed', err.message);
        process.exit(1);
    }
}
connectDB();

//routes
app.use('/api/storage', storageRoutes);
app.get('/', (req,res) =>res.send('API is ruunning'));

//server status
app.listen(5000, () => console.log('server running at 5000'));
    
