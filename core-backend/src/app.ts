// src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import notificationsRouter from './routes/notifications.route.js';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());
app.use('/notifications', notificationsRouter);


app.get('/', (req, res)=>
{
     res.send('Hello World');
});

app.listen(port, ()=>{
     console.log(`Connected successfully on port ${port}`);
});
