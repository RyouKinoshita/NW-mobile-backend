const dotenv = require('dotenv');
// const { Server } = require('socket.io');
const connectDatabase = require('./config/database');
const app = require('./App');
dotenv.config({ path: './config/.env' });
connectDatabase();
const port = process.env.PORT || 8080;
const server = app.listen(port, () => console.log(`Server Started: http://localhost:${port}/`))