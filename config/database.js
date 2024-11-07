const mongoose = require('mongoose');

require("dotenv").config();

const dbconnect = ()=>{
    mongoose.connect(process.env.DATABASE_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    .then(()=>{
        console.log("connectd")
    })
    .catch((err)=>{
        console.log(err);
        console.error(err);
        console.log("Some error ocured in conecting mongoose")
        process.exit(1);
    });
}

module.exports=dbconnect;
