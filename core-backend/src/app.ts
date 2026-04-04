// src/app.ts

import express from 'express';
import dotenv from 'dotenv';
import gameRoutes from './routes/game.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import settingRoutes from './routes/setting.routes.js';

dotenv.config();

const app = express();
const port = 5000;

app.use(express.json());

app.use('/api/game', gameRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/setting', settingRoutes);

app.get('/', (_req, res) => {
    res.send('root@depauw backend');
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Connected successfully on port ${port}`);
});
