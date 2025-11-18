import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import RestaurantModel from "../models/ResModel.js";
import { metrics } from '../middleware/prometheus.middleware.js';
import { AuthenticateUser } from "./UserRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Register Route
router.post('/res/register', async (req, res) => {
  const { ownerName, password, restaurantName, phone, email, city, address, countryName, stateName } = req.body;

  try {
    let user = await RestaurantModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new RestaurantModel({
      ownerName,
      password: hashedPassword,
      restaurantName,
      phone,
      email,
      city,
      address,
      countryName,
      stateName
    });

    await user.save();

    // ✅ Track metric: New restaurant registered
    metrics.recordRestaurant('active');

    return res.json({ status: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// Login Route
router.post('/ResLogin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await RestaurantModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User is not registered" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.KEY, { expiresIn: "1h" });
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour
      secure: process.env.RAILWAY_ENVIRONMENT_NAME === 'production', // true trên Railway
      sameSite: process.env.RAILWAY_ENVIRONMENT_NAME === 'production' ? 'none' : 'lax', // 'none' cho cross-origin
      domain: process.env.RAILWAY_ENVIRONMENT_NAME === 'production' ? undefined : 'localhost'
    }); // 1 hour in milliseconds

    return res.json({ status: true, message: "Login successful" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// Forgot Password Route
router.post('/ResForgotPasswordDialog', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await RestaurantModel.findOne({ email });
    if (!user) {
      return res.json({ message: "User not registered" });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'vermabhoomi10248932@gmail.com',
        pass: 'fzzk drtd xspp zirk'
      }
    });

    const token = jwt.sign({ id: user._id }, process.env.KEY, { expiresIn: "1h" });

    const mailOptions = {
      from: 'vermabhoomi10248932@gmail.com',
      to: email,
      subject: 'Reset Your FoodieBuddy Password',
      text: `Hi,

We received a request to reset your FoodieBuddy password. If you made this request, please click the link below to set a new password.

If you didn't request a password reset, please ignore this email or let us know.

${process.env.FRONTEND_URL}/ResResetPassword/${token}

Thank you for being a part of the FoodieBuddy community!

Best regards,
The FoodieBuddy Restaurant Partners Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.json({ message: "Error sending email" });
      } else {
        console.log("Email sent:", info.response);
        return res.json({ status: "success", message: "Email sent" });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

// Reset Password Route
router.post('/ResResetPassword/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.KEY);
    const id = decoded.id;

    const hashedPassword = await bcrypt.hash(password, 10);
    await RestaurantModel.findOneAndUpdate({ _id: id }, { password: hashedPassword });

    return res.json({ status: 'success', message: 'Password updated' });
  } catch (err) {
    console.error(err);
    return res.json({ message: 'Invalid Token' });
  }
});

// Middleware to Verify User
export const Authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Retrieve token from cookies
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const verifyToken = jwt.verify(token, process.env.KEY);
    const rootResUser = await RestaurantModel.findOne({ _id: verifyToken.id });
    
    if (!rootResUser) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    
    req.token = token;
    req.rootResUser = rootResUser;
    req.ResUserId = rootResUser._id;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}

// Verify Endpoint


router.get('/logout',(req,res)=>{
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.RAILWAY_ENVIRONMENT_NAME === 'production',
    sameSite: process.env.RAILWAY_ENVIRONMENT_NAME === 'production' ? 'none' : 'lax'
  });
  return res.json({ status: true });
});

//Dashboard
router.get('/RestaurantLayout/ResDashBoard', Authenticate, (req, res) => {
  res.json(req.rootResUser); // Send the user data as JSON
});
//Details
router.get('/RestaurantLayout/ResDetails', Authenticate, (req, res) => {
  res.json(req.rootResUser); 
});
router.patch('/updateDetails/:restaurantId', async (req, res) => {
  try {
      const { restaurantId } = req.params;
      
      if (!restaurantId) {
          return res.status(400).json({ error: 'Restaurant ID is required' });
      }
      
      

      res.status(200).json({ message: 'Details updated successfully' });
  } catch (error) {
      console.error('Error updating details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get all restaurants
router.get('/Restaurants',AuthenticateUser, async (req,res) => {
  try {
    const restaurants = await RestaurantModel.find({}).select("-password -ownerName").populate("menu");
    
    if(restaurants){
      return res.status(200).json(restaurants);
    }
    return res.status(500).json({ error: 'Internal server error' });

  } catch (error) {
    console.error('Error updating details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
})

// Route to open or close restaurant
router.patch('/updateStatus/:restaurantId',Authenticate, async (req, res) => {
  try {
      const { restaurantId } = req.params;
      const {status} = req.body;
      if (!restaurantId) {
          return res.status(400).json({ error: 'Restaurant ID is required' });
      }
      
      const restaurant = await RestaurantModel.findById(restaurantId);
      
      if (!restaurant) {
          return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      status === "Open" ? restaurant.isOpen = true : restaurant.isOpen = false;
      await restaurant.save();
      
      res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
