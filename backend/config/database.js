const mongoose = require('mongoose');

const connectDatabase = () => {
    const MONGO_URI = process.env.MONGO_URI;
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log("Mongoose Connected");
        });
}

module.exports = connectDatabase;