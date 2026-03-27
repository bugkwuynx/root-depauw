// src/app.ts

import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5000;

app.get('/', (req, res)=>
{
     res.send('Hello World');
});

 app.listen(port, ()=>{
     console.log(
`Connected successfully on port ${port}`)
});
