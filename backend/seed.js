const mongoose = require("mongoose");
const User = require("./models/userModel");
require("dotenv").config({ path: "./backend/config/config.env" });

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@flipkart.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Create new admin user
    const adminUser = new User({
      name: "Admin",
      email: "admin@flipkart.com",
      gender: "Male",
      password: "admin123",
      role: "admin",
    });

    await adminUser.save();
    console.log("✓ Admin user created successfully!");
    console.log("\nLogin Credentials:");
    console.log("Email: admin@flipkart.com");
    console.log("Password: admin123");
    console.log("\nGo to: http://localhost:3000/login");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdminUser();
