const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/dbConfig');
const auth = require('./routes/auth');
const article = require('./routes/postRoutes');


const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Connect to MongoDB
connectDB();


// Routes
app.use("/api/v1", auth);
app.use("/api/v1/article", article);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});