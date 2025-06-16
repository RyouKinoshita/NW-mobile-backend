const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/dbConfig');
const auth = require('./routes/auth');
const sack = require('./routes/sackRoutes');
const waste = require('./routes/wasteRoutes');
const machinelearning = require('./routes/mlRoutes');
const notification = require("./routes/notification");
const track = require("./routes/track");
const item = require("./routes/productRoutes");

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connectDB();
app.use("/api/v1", auth);
app.use("/api/v1/sack", sack);
app.use("/api/v1/waste", waste);
app.use("/api/v1/ml", machinelearning);
app.use("/api/v1/notifications", notification);
app.use("/api/v1/track", track);
app.use("/api/v1/item", item);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});