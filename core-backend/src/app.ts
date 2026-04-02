// src/app.ts
import express from 'express';
import dotenv from 'dotenv';

// Routes
import notificationsRouter from './routes/notifications.route.js';

dotenv.config();

const app = express();
const port = 5000;

app.use(express.json());
app.use('/notifications', notificationsRouter);


app.get('/', (req, res)=>
{
     res.send('Hello World');
});

app.listen(port, ()=>{
     console.log(`Connected successfully on port ${port}`);
});
