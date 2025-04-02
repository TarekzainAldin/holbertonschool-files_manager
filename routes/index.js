import express from 'express';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const app = express.Router();
app.use(express.json()); // Middleware to parse JSON request bodies

// POST route to create a new user
app.post('/users', UsersController.postNew);
app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);

export default app;
