import express from 'express';
import { register, login, discordLogin, getCurrentUser, logout } from '../controllers/authController.js';

const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Discord OAuth login route
router.post('/discord-login', discordLogin);

// Get current user route
router.get('/me', getCurrentUser);

// Logout route
router.post('/logout', logout);

export default router; 