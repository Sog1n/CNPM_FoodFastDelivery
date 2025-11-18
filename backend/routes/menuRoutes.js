// routes/menu.js
import express from 'express';
import { upload } from '../middleware/multer.middleware.js';
import MenuItemModel from '../models/MenuModel.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {Authenticate} from '../routes/ResRoutes.js'
import {AuthenticateUser} from '../routes/UserRoutes.js'
import { metrics } from '../middleware/prometheus.middleware.js';
import fs from 'fs';


const router = express.Router();

// Route to create a new menu item
router.post('/ResMenu', Authenticate,upload.single('image'), async (req, res) => {
  try {
    const { dishName, price, description, cuisineName } = req.body;
    const localFilePath = req.file.path;
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
      throw new Error('File upload failed');
    }

    const menuItem = await MenuItemModel.create({
      dishName,
      price,
      description,
      cuisineName,
      image: cloudinaryResponse.url,
      ownerId: req.ResUserId
    });

    fs.unlinkSync(localFilePath); // Remove the local file after uploading to Cloudinary

    // ✅ Track metric: New menu item created
    // Using restaurant metric as proxy for menu items
    metrics.recordRestaurant('menu_item_added');

    res.status(200).json(menuItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to get all menu items
router.get('/ResMenu', Authenticate,async (req, res) => {
  try {
    const menuItems = await MenuItemModel.find({
      ownerId: req.ResUserId
    });
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// Route to get restaurant menu by restaurant ID
router.get('/ResMenu/:resId' ,AuthenticateUser,async (req, res) => {
  try {
    const { resId } = req.params;
    const menuItem = await MenuItemModel.find({
      ownerId: resId
    });
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});



// Route to get restaurant menu by restaurant ID
router.get('/EditMenu/:editId' ,Authenticate,async (req, res) => {
  try {
    const { editId } = req.params;
    const menuItem = await MenuItemModel.findById(editId);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});



// Route to update a menu item by ID
router.patch('/ResMenu/:id',Authenticate ,upload.single('image'), async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const { dishName, price, description, cuisineName } = req.body;
  const updateData = {
    dishName,
    price,
    description,
    cuisineName,
  };

  if (req.file) {
    const localFilePath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
      throw new Error('File upload failed');
    }

    updateData.image = cloudinaryResponse.url;
    fs.unlinkSync(localFilePath); // Remove the local file after uploading to Cloudinary
  }

  try {
    const updatedItem = await MenuItemModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Route to delete a menu Item
router.delete('/DeleteMenu/:id', Authenticate,async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItemModel.findByIdAndDelete(id);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not deleted' });
    }
    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete menu item' });
  }
}
)

// Route to toggle inStock
router.patch('/toggleStock/:id', Authenticate,async (req, res) => {
  const { id } = req.params;
  const { inStock } = req.body;

  // Log the received parameters for debugging purposes
  console.log(id, inStock);

  // Validate inStock is a boolean
  if (typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'Invalid value for inStock. It must be a boolean.' });
  }

  try {
    const menuItem = await MenuItemModel.findByIdAndUpdate(id, { inStock }, { new: true });

    // Log the updated menu item for debugging purposes
    console.log(menuItem);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    return res.status(200).json({ message: 'Stock updated successfully' });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);
    return res.status(500).json({ error: 'Failed to update stock' });
  }
});

router.get('/ResMenu', Authenticate, async (req, res) => {
  try {
    const menuItems = await MenuItemModel.find({ ownerId: req.userId }); // Retrieve menus specific to the logged in user
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});
//router to fetch all the usinque names of cuisine 
router.get('/cuisineNames', AuthenticateUser, async (req, res) => {
  try {
    const cuisineNames = await MenuItemModel.distinct('cuisineName');
    res.status(200).json(cuisineNames);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cuisine names' });
  }
});
export default router;
