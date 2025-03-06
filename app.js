const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/dbConfig');
const auth = require('./routes/auth');
const sack = require('./routes/sackRoutes');
const AddToSack = require("./model/addtosack");


const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connectDB();
app.use("/api/v1", auth);
app.use("/api/v1/sack", sack);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
