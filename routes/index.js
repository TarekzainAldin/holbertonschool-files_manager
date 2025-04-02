import express from 'express';
import UsersController from '../controllers/UsersController';

const app = express.Router();
app.use(express.json()); // Middleware to parse JSON request bodies

// POST route to create a new user
app.post('/users', UsersController.postNew);

export default app;
