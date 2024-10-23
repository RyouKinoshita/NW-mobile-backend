const mongoose = require('mongoose');

const connectDatabase = () => {
    console.log(process.env.DB_URI)
    mongoose.connect(process.env.DB_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    }).then(con => {
        console.log(`MongoDB Database connected with HOST: ${con.connection.host}`)
    }).catch(err => {
        console.log(`Server Error: ${err}`)
    })
}

module.exports = connectDatabase;