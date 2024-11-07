
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportlocalMongoose= require("passport-local-mongoose");


const userSchema=new Schema({

 
 email:{
    type:String,
    required:true,
  },

  
});

userSchema.plugin(passportlocalMongoose);
module.exports=mongoose.model("User",userSchema);