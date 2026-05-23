const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const cors = require('cors');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. Load Environment Variables ---
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// --- 2. Database Connection ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};
connectDB();

// --- 3. Global Middleware ---
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger

// Ensure 'uploads' directory exists and serve static files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// --- 4. Custom Error Handling Middleware ---
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

// --- 5. JWT Generation Helper ---
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// --- 6. Authentication Middleware (Protect routes) ---
const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); // Attach user to request
            next();
        } catch (error) {
            console.error('Not authorized, token failed');
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// --- 7. Authorization Middleware (Roles) ---
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route. Required roles: ${roles.join(', ')}`);
        }
        next();
    };
};

// --- 8. Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
});

// --- 9. Mongoose Models ---

// User Model
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['customer', 'restaurant_owner', 'delivery_person', 'admin'],
        default: 'customer',
    },
    phoneNumber: { type: String },
    addresses: [
        {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String },
            isDefault: { type: Boolean, default: false },
        },
    ],
    profilePicture: { type: String }, // URL to image
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// FoodItem Model
const foodItemSchema = mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    category: { type: String },
    imageUrl: { type: String }, // URL to image
    isAvailable: { type: Boolean, default: true },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    allergens: [{ type: String }],
}, { timestamps: true });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

// Restaurant Model
const restaurantSchema = mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'USA' },
        coordinates: { // GeoJSON Point for geospatial queries
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere'
            }
        }
    },
    phoneNumber: { type: String },
    email: { type: String, unique: true, sparse: true }, // Sparse to allow multiple nulls
    cuisineType: [{ type: String }],
    imageUrl: { type: String }, // URL to image
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    openingHours: [{ // Example: { day: 'Monday', open: '09:00', close: '22:00' }
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        open: { type: String },
        close: { type: String },
    }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Order Model
const orderSchema = mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [
        {
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true }, // Price at the time of order
        },
    ],
    totalAmount: { type: Number, required: true, default: 0 },
    deliveryAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash_on_delivery', 'paypal'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
    deliveryFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    notes: { type: String }, // Customer notes
    deliveryAttemptedAt: { type: Date },
    deliveredAt: { type: Date },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Review Model
const reviewSchema = mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    imageUrls: [{ type: String }], // Optional images for review
}, { timestamps: true });

reviewSchema.statics.updateRestaurantRating = async function (restaurantId) {
    const stats = await this.aggregate([
        { $match: { restaurant: restaurantId } },
        {
            $group: {
                _id: '$restaurant',
                avgRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        await Restaurant.findByIdAndUpdate(restaurantId, {
            rating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
            numReviews: stats[0] ? stats[0].numOfReviews : 0,
        });
    } catch (err) {
        console.error(err);
    }
};

reviewSchema.post('save', async function () {
    await this.constructor.updateRestaurantRating(this.restaurant);
});

reviewSchema.post('remove', async function () {
    await this.constructor.updateRestaurantRating(this.restaurant);
});

const Review = mongoose.model('Review', reviewSchema);

// --- 10. Controllers ---

// Auth Controller
const authController = {
    registerUser: asyncHandler(async (req, res) => {
        const { name, email, password, role, phoneNumber, addresses } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer', // Default role
            phoneNumber,
            addresses
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                addresses: user.addresses,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    }),

    loginUser: asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                addresses: user.addresses,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    }),

    getUserProfile: asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    }),

    updateUserProfile: asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.addresses = req.body.addresses ? JSON.parse(req.body.addresses) : user.addresses;
            user.profilePicture = req.file ? `/uploads/${req.file.filename}` : (req.body.profilePicture || user.profilePicture);

            if (req.body.password) {
                user.password = req.body.password; // Mongoose pre-save hook will hash it
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phoneNumber: updatedUser.phoneNumber,
                addresses: updatedUser.addresses,
                profilePicture: updatedUser.profilePicture,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    }),
};

// User Controller (Admin only for full user management)
const userController = {
    getUsers: asyncHandler(async (req, res) => {
        const users = await User.find({});
        res.json(users);
    }),

    getUserById: asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    }),

    updateUser: asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.addresses = req.body.addresses ? JSON.parse(req.body.addresses) : user.addresses;
            user.profilePicture = req.file ? `/uploads/${req.file.filename}` : (req.body.profilePicture || user.profilePicture);

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phoneNumber: updatedUser.phoneNumber,
                addresses: updatedUser.addresses,
                profilePicture: updatedUser.profilePicture,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    }),

    deleteUser: asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    }),
};

// Restaurant Controller
const restaurantController = {
    getRestaurants: asyncHandler(async (req, res) => {
        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword, $options: 'i' } },
                    { 'cuisineType': { $regex: req.query.keyword, $options: 'i' } },
                    { 'address.city': { $regex: req.query.keyword, $options: 'i' } },
                ]
            }
            : {};

        const restaurants = await Restaurant.find({ ...keyword, isActive: true }).populate('owner', 'name email');
        res.json(restaurants);
    }),

    getRestaurantById: asyncHandler(async (req, res) => {
        const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email');
        if (restaurant && restaurant.isActive) {
            res.json(restaurant);
        } else if (restaurant && !restaurant.isActive && req.user && req.user.role !== 'admin' && String(restaurant.owner) !== String(req.user._id)) {
            res.status(404);
            throw new Error('Restaurant not found or inactive');
        }
        else if (restaurant && !restaurant.isActive && req.user && (req.user.role === 'admin' || String(restaurant.owner) === String(req.user._id))) {
            // Allow admin or owner to view inactive restaurant
            res.json(restaurant);
        }
        else {
            res.status(404);
            throw new Error('Restaurant not found');
        }
    }),

    createRestaurant: asyncHandler(async (req, res) => {
        const { name, description, address, phoneNumber, email, cuisineType, openingHours } = req.body;

        const restaurantExists = await Restaurant.findOne({ name });
        if (restaurantExists) {
            res.status(400);
            throw new Error('Restaurant with this name already exists');
        }

        const restaurant = new Restaurant({
            owner: req.user._id, // Owner is the current logged-in user (restaurant_owner or admin)
            name,
            description,
            address: JSON.parse(address), // Address might come as stringified JSON
            phoneNumber,
            email,
            cuisineType: JSON.parse(cuisineType), // cuisineType might come as stringified JSON array
            imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl,
            openingHours: openingHours ? JSON.parse(openingHours) : [],
        });

        const createdRestaurant = await restaurant.save();
        res.status(201).json(createdRestaurant);
    }),

    updateRestaurant: asyncHandler(async (req, res) => {
        const { name, description, address, phoneNumber, email, cuisineType, openingHours, isActive } = req.body;

        const restaurant = await Restaurant.findById(req.params.id);

        if (restaurant) {
            // Only owner or admin can update
            if (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to update this restaurant');
            }

            restaurant.name = name || restaurant.name;
            restaurant.description = description || restaurant.description;
            restaurant.address = address ? JSON.parse(address) : restaurant.address;
            restaurant.phoneNumber = phoneNumber || restaurant.phoneNumber;
            restaurant.email = email || restaurant.email;
            restaurant.cuisineType = cuisineType ? JSON.parse(cuisineType) : restaurant.cuisineType;
            restaurant.imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || restaurant.imageUrl);
            restaurant.openingHours = openingHours ? JSON.parse(openingHours) : restaurant.openingHours;
            restaurant.isActive = typeof isActive === 'boolean' ? isActive : restaurant.isActive; // Only admin/owner can change this

            const updatedRestaurant = await restaurant.save();
            res.json(updatedRestaurant);
        } else {
            res.status(404);
            throw new Error('Restaurant not found');
        }
    }),

    deleteRestaurant: asyncHandler(async (req, res) => {
        const restaurant = await Restaurant.findById(req.params.id);

        if (restaurant) {
            // Only owner or admin can delete
            if (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to delete this restaurant');
            }
            await restaurant.deleteOne();
            await FoodItem.deleteMany({ restaurant: req.params.id }); // Delete all food items for the restaurant
            await Order.updateMany({ restaurant: req.params.id }, { status: 'cancelled', notes: 'Restaurant removed' }); // Cancel related orders
            await Review.deleteMany({ restaurant: req.params.id }); // Delete related reviews
            res.json({ message: 'Restaurant removed' });
        } else {
            res.status(404);
            throw new Error('Restaurant not found');
        }
    }),

    getRestaurantMenu: asyncHandler(async (req, res) => {
        const foodItems = await FoodItem.find({ restaurant: req.params.id, isAvailable: true });
        res.json(foodItems);
    }),

    updateRestaurantImage: asyncHandler(async (req, res) => {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            res.status(404);
            throw new Error('Restaurant not found');
        }

        if (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to update this restaurant image');
        }

        if (req.file) {
            restaurant.imageUrl = `/uploads/${req.file.filename}`;
            const updatedRestaurant = await restaurant.save();
            res.json({
                message: 'Restaurant image updated successfully',
                imageUrl: updatedRestaurant.imageUrl
            });
        } else {
            res.status(400);
            throw new Error('No image file provided');
        }
    }),
};

// Food Item Controller
const foodItemController = {
    getFoodItems: asyncHandler(async (req, res) => {
        const foodItems = await FoodItem.find(req.query.restaurant ? { restaurant: req.query.restaurant } : {}).populate('restaurant', 'name');
        res.json(foodItems);
    }),

    getFoodItemById: asyncHandler(async (req, res) => {
        const foodItem = await FoodItem.findById(req.params.id).populate('restaurant', 'name');
        if (foodItem) {
            res.json(foodItem);
        } else {
            res.status(404);
            throw new Error('Food item not found');
        }
    }),

    createFoodItem: asyncHandler(async (req, res) => {
        const { restaurant, name, description, price, category, isAvailable, isVegetarian, isVegan, allergens } = req.body;

        const restaurantObj = await Restaurant.findById(restaurant);
        if (!restaurantObj) {
            res.status(404);
            throw new Error('Restaurant not found');
        }

        // Only owner of the restaurant or admin can add food items
        if (String(restaurantObj.owner) !== String(req.user._id) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to add food items to this restaurant');
        }

        const foodItem = new FoodItem({
            restaurant,
            name,
            description,
            price,
            category,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl,
            isAvailable: isAvailable === 'true',
            isVegetarian: isVegetarian === 'true',
            isVegan: isVegan === 'true',
            allergens: allergens ? JSON.parse(allergens) : [],
        });

        const createdFoodItem = await foodItem.save();
        res.status(201).json(createdFoodItem);
    }),

    updateFoodItem: asyncHandler(async (req, res) => {
        const { name, description, price, category, isAvailable, isVegetarian, isVegan, allergens } = req.body;

        const foodItem = await FoodItem.findById(req.params.id);

        if (foodItem) {
            const restaurantObj = await Restaurant.findById(foodItem.restaurant);
            // Only owner of the restaurant or admin can update food items
            if (String(restaurantObj.owner) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to update this food item');
            }

            foodItem.name = name || foodItem.name;
            foodItem.description = description || foodItem.description;
            foodItem.price = price || foodItem.price;
            foodItem.category = category || foodItem.category;
            foodItem.imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || foodItem.imageUrl);
            foodItem.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : foodItem.isAvailable;
            foodItem.isVegetarian = typeof isVegetarian === 'boolean' ? isVegetarian : foodItem.isVegetarian;
            foodItem.isVegan = typeof isVegan === 'boolean' ? isVegan : foodItem.isVegan;
            foodItem.allergens = allergens ? JSON.parse(allergens) : foodItem.allergens;

            const updatedFoodItem = await foodItem.save();
            res.json(updatedFoodItem);
        } else {
            res.status(404);
            throw new Error('Food item not found');
        }
    }),

    deleteFoodItem: asyncHandler(async (req, res) => {
        const foodItem = await FoodItem.findById(req.params.id);

        if (foodItem) {
            const restaurantObj = await Restaurant.findById(foodItem.restaurant);
            // Only owner of the restaurant or admin can delete food items
            if (String(restaurantObj.owner) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to delete this food item');
            }
            await foodItem.deleteOne();
            res.json({ message: 'Food item removed' });
        } else {
            res.status(404);
            throw new Error('Food item not found');
        }
    }),
};

// Order Controller
const orderController = {
    createOrder: asyncHandler(async (req, res) => {
        const { restaurant: restaurantId, items, deliveryAddress, paymentMethod, notes } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No order items');
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isActive) {
            res.status(404);
            throw new Error('Restaurant not found or inactive');
        }

        // Calculate total amount and validate items
        let totalAmount = 0;
        const orderItems = [];
        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItem);
            if (!foodItem || !foodItem.isAvailable || String(foodItem.restaurant) !== String(restaurantId)) {
                res.status(400);
                throw new Error(`Food item ${item.foodItem} not found, unavailable, or does not belong to this restaurant`);
            }
            orderItems.push({
                foodItem: foodItem._id,
                name: foodItem.name,
                quantity: item.quantity,
                price: foodItem.price,
            });
            totalAmount += foodItem.price * item.quantity;
        }

        // Add delivery fee and tax (example, can be dynamic)
        const deliveryFee = 5;
        const taxRate = 0.08;
        const taxAmount = totalAmount * taxRate;
        totalAmount += deliveryFee + taxAmount;


        const order = new Order({
            customer: req.user._id,
            restaurant: restaurantId,
            items: orderItems,
            totalAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: paymentMethod,
            deliveryFee: deliveryFee,
            taxAmount: taxAmount,
            notes: notes,
            status: 'pending', // Initial status
            paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid', // Assuming online payments are 'paid' initially
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    }),

    getCustomerOrders: asyncHandler(async (req, res) => {
        const orders = await Order.find({ customer: req.user._id })
            .populate('restaurant', 'name imageUrl address.street address.city')
            .populate('items.foodItem', 'name price imageUrl')
            .sort({ createdAt: -1 });
        res.json(orders);
    }),

    getRestaurantOrders: asyncHandler(async (req, res) => {
        const restaurantId = req.params.restaurantId;
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            res.status(404);
            throw new Error('Restaurant not found');
        }

        // Only owner of the restaurant or admin can view these orders
        if (String(restaurant.owner) !== String(req.user._id) && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view orders for this restaurant');
        }

        const orders = await Order.find({ restaurant: restaurantId })
            .populate('customer', 'name email phoneNumber')
            .populate('deliveryPerson', 'name phoneNumber')
            .populate('items.foodItem', 'name price')
            .sort({ createdAt: -1 });
        res.json(orders);
    }),

    getDeliveryPersonOrders: asyncHandler(async (req, res) => {
        // For delivery person: get orders that are 'confirmed' or 'preparing' and not yet assigned or assigned to them
        const orders = await Order.find({
            status: { $in: ['confirmed', 'preparing', 'out_for_delivery'] },
            $or: [{ deliveryPerson: null }, { deliveryPerson: req.user._id }]
        })
            .populate('customer', 'name phoneNumber')
            .populate('restaurant', 'name address.street address.city phoneNumber')
            .sort({ createdAt: -1 });
        res.json(orders);
    }),

    getOrderById: asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email phoneNumber addresses')
            .populate('restaurant', 'name imageUrl address.street address.city phoneNumber owner') // Populate owner to check authorization
            .populate('deliveryPerson', 'name phoneNumber')
            .populate('items.foodItem', 'name price imageUrl');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Authorization check: customer owns the order, restaurant owner owns restaurant, delivery person is assigned, or admin
        const isCustomer = String(order.customer._id) === String(req.user._id);
        const isRestaurantOwner = order.restaurant && String(order.restaurant.owner) === String(req.user._id);
        const isDeliveryPerson = order.deliveryPerson && String(order.deliveryPerson) === String(req.user._id);
        const isAdmin = req.user.role === 'admin';

        if (!isCustomer && !isRestaurantOwner && !isDeliveryPerson && !isAdmin) {
            res.status(403);
            throw new Error('Not authorized to view this order');
        }

        res.json(order);
    }),

    updateOrderStatus: asyncHandler(async (req, res) => {
        const { status, deliveryPersonId } = req.body;
        const order = await Order.findById(req.params.id).populate('restaurant', 'owner'); // Populate restaurant owner for auth

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // --- Authorization logic for status updates ---
        const isAdmin = req.user.role === 'admin';
        const isRestaurantOwner = order.restaurant && String(order.restaurant.owner) === String(req.user._id);
        const isDeliveryPerson = String(order.deliveryPerson) === String(req.user._id); // Assigned delivery person

        // Customer can only cancel pending orders
        if (req.user.role === 'customer') {
            if (status === 'cancelled' && order.status === 'pending') {
                order.status = status;
            } else {
                res.status(403);
                throw new Error('Customer can only cancel pending orders');
            }
        }
        // Restaurant owner can confirm, prepare, or mark out for delivery (if assigned)
        else if (isRestaurantOwner) {
            if (['confirmed', 'preparing'].includes(status) && order.status === 'pending') {
                order.status = status;
            } else if (status === 'out_for_delivery' && (order.status === 'confirmed' || order.status === 'preparing') && order.deliveryPerson) {
                // Restaurant can only mark out for delivery IF a delivery person is already assigned
                order.status = status;
                order.deliveryAttemptedAt = new Date();
            } else if (status === 'cancelled' && ['pending', 'confirmed', 'preparing'].includes(order.status)) {
                order.status = status;
            } else {
                res.status(403);
                throw new Error('Restaurant owner has limited permissions for this status update.');
            }
        }
        // Delivery person can accept, mark out for delivery, and delivered
        else if (req.user.role === 'delivery_person') {
            if (status === 'out_for_delivery' && (order.status === 'confirmed' || order.status === 'preparing') && !order.deliveryPerson) {
                // Delivery person accepts the order
                order.deliveryPerson = req.user._id;
                order.status = status;
                order.deliveryAttemptedAt = new Date();
            } else if (status === 'out_for_delivery' && isDeliveryPerson && (order.status === 'confirmed' || order.status === 'preparing')) {
                // Assigned delivery person continues delivery process
                order.status = status;
                order.deliveryAttemptedAt = new Date();
            } else if (status === 'delivered' && isDeliveryPerson && order.status === 'out_for_delivery') {
                order.status = status;
                order.deliveredAt = new Date();
            } else {
                res.status(403);
                throw new Error('Delivery person has limited permissions for this status update.');
            }
        }
        // Admin has full control
        else if (isAdmin) {
            if (status) order.status = status;
            if (deliveryPersonId) order.deliveryPerson = deliveryPersonId; // Admin can assign delivery person
            if (status === 'delivered') order.deliveredAt = new Date();
            if (status === 'out_for_delivery') order.deliveryAttemptedAt = new Date();
        } else {
            res.status(403);
            throw new Error('Not authorized to update this order status.');
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }),

    deleteOrder: asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Only admin can delete orders (or customer if pending and within a time limit, but admin is simpler for this example)
            if (req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to delete this order');
            }
            await order.deleteOne();
            res.json({ message: 'Order removed' });
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    }),
};

// Review Controller
const reviewController = {
    createReview: asyncHandler(async (req, res) => {
        const { restaurant: restaurantId, rating, comment } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            res.status(404);
            throw new Error('Restaurant not found');
        }

        // Check if the user has ordered from this restaurant
        const hasOrdered = await Order.exists({
            customer: req.user._id,
            restaurant: restaurantId,
            status: 'delivered'
        });

        if (!hasOrdered && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('You can only review restaurants you have ordered from and received delivery.');
        }

        // Check if user already reviewed this restaurant
        const alreadyReviewed = await Review.findOne({
            customer: req.user._id,
            restaurant: restaurantId,
        });

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('You have already reviewed this restaurant.');
        }

        const review = new Review({
            customer: req.user._id,
            restaurant: restaurantId,
            rating,
            comment,
            imageUrls: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
        });

        const createdReview = await review.save();
        res.status(201).json(createdReview);
    }),

    getRestaurantReviews: asyncHandler(async (req, res) => {
        const reviews = await Review.find({ restaurant: req.params.restaurantId })
            .populate('customer', 'name profilePicture')
            .sort({ createdAt: -1 });
        res.json(reviews);
    }),

    getReviewById: asyncHandler(async (req, res) => {
        const review = await Review.findById(req.params.id)
            .populate('customer', 'name profilePicture')
            .populate('restaurant', 'name');
        if (review) {
            res.json(review);
        } else {
            res.status(404);
            throw new Error('Review not found');
        }
    }),

    updateReview: asyncHandler(async (req, res) => {
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.id);

        if (review) {
            // Only the customer who created the review or admin can update
            if (String(review.customer) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to update this review');
            }

            review.rating = rating || review.rating;
            review.comment = comment || review.comment;
            review.imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : (req.body.imageUrls || review.imageUrls);


            const updatedReview = await review.save();
            res.json(updatedReview);
        } else {
            res.status(404);
            throw new Error('Review not found');
        }
    }),

    deleteReview: asyncHandler(async (req, res) => {
        const review = await Review.findById(req.params.id);

        if (review) {
            // Only the customer who created the review or admin can delete
            if (String(review.customer) !== String(req.user._id) && req.user.role !== 'admin') {
                res.status(403);
                throw new Error('Not authorized to delete this review');
            }
            await review.deleteOne();
            res.json({ message: 'Review removed' });
        } else {
            res.status(404);
            throw new Error('Review not found');
        }
    }),
};

// --- 11. Routes ---

// Auth Routes
app.post('/api/auth/register', authController.registerUser);
app.post('/api/auth/login', authController.loginUser);
app.get('/api/auth/profile', protect, authController.getUserProfile);
app.put('/api/auth/profile', protect, upload.single('profilePicture'), authController.updateUserProfile);

// User Routes (Admin only for full management)
app.route('/api/users')
    .get(protect, authorize('admin'), userController.getUsers);
app.route('/api/users/:id')
    .get(protect, authorize('admin'), userController.getUserById)
    .put(protect, authorize('admin'), upload.single('profilePicture'), userController.updateUser)
    .delete(protect, authorize('admin'), userController.deleteUser);

// Restaurant Routes
app.route('/api/restaurants')
    .get(protect, restaurantController.getRestaurants) // All users can view restaurants
    .post(protect, authorize('restaurant_owner', 'admin'), upload.single('imageUrl'), restaurantController.createRestaurant); // Only owners/admin can create

app.route('/api/restaurants/:id')
    .get(protect, restaurantController.getRestaurantById) // All users can view single restaurant
    .put(protect, authorize('restaurant_owner', 'admin'), upload.single('imageUrl'), restaurantController.updateRestaurant)
    .delete(protect, authorize('restaurant_owner', 'admin'), restaurantController.deleteRestaurant);

app.get('/api/restaurants/:id/menu', protect, restaurantController.getRestaurantMenu); // Get menu for a restaurant

app.put('/api/restaurants/:id/uploadImage', protect, authorize('restaurant_owner', 'admin'), upload.single('imageUrl'), restaurantController.updateRestaurantImage);

// Food Item Routes
app.route('/api/fooditems')
    .get(protect, foodItemController.getFoodItems) // All users can view food items (optionally filter by restaurant)
    .post(protect, authorize('restaurant_owner', 'admin'), upload.single('imageUrl'), foodItemController.createFoodItem); // Owners/admin create

app.route('/api/fooditems/:id')
    .get(protect, foodItemController.getFoodItemById)
    .put(protect, authorize('restaurant_owner', 'admin'), upload.single('imageUrl'), foodItemController.updateFoodItem)
    .delete(protect, authorize('restaurant_owner', 'admin'), foodItemController.deleteFoodItem);

// Order Routes
app.route('/api/orders')
    .post(protect, authorize('customer'), orderController.createOrder) // Customer creates order
    .get(protect, authorize('customer'), orderController.getCustomerOrders); // Customer views their orders

app.route('/api/orders/restaurant/:restaurantId') // Get orders for a specific restaurant (owner/admin)
    .get(protect, authorize('restaurant_owner', 'admin'), orderController.getRestaurantOrders);

app.route('/api/orders/delivery') // Get orders for a delivery person
    .get(protect, authorize('delivery_person', 'admin'), orderController.getDeliveryPersonOrders);

app.route('/api/orders/:id')
    .get(protect, orderController.getOrderById) // Any relevant user can view their specific order
    .put(protect, authorize('customer', 'restaurant_owner', 'delivery_person', 'admin'), orderController.updateOrderStatus) // Update status based on role
    .delete(protect, authorize('admin'), orderController.deleteOrder); // Only admin can delete entirely

// Review Routes
app.route('/api/reviews')
    .post(protect, authorize('customer', 'admin'), upload.array('imageUrls', 5), reviewController.createReview); // Customer creates review

app.route('/api/restaurants/:restaurantId/reviews')
    .get(protect, reviewController.getRestaurantReviews); // Get reviews for a restaurant

app.route('/api/reviews/:id')
    .get(protect, reviewController.getReviewById)
    .put(protect, authorize('customer', 'admin'), upload.array('imageUrls', 5), reviewController.updateReview)
    .delete(protect, authorize('customer', 'admin'), reviewController.deleteReview);

// --- 12. Health Check Route ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// --- 13. Error Handling Middleware (Last middleware) ---
app.use(notFound);
app.use(errorHandler);

// --- 14. Start Server ---
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});