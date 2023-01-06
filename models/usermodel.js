const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
 const session = require("express-session");
 var findOrCreate = require('mongoose-findorcreate');
 const passportLocalMongoose = require('passport-local-mongoose');
const app = express();


 app.use(passport.initialize());
 app.use(passport.session());


mongoose.connect(process.env.MONGOURI,{
  useNewUrlParser:true,

  useUnifiedTopology:true,

});
 const userSchema = new mongoose.Schema({
   googleId:String,
   githubId:String,
   firstname: String,
   lastname: String,
   username: {type:String,unique:true},
   email: {type:String,unique:true},
   image:{type: String, default: 'images/defaultProfile.png'},
   messages:[{lstMessage:{type:String,default:null},date:String,senderMail:String,sender:String,body:String,time:String,seen:{type:Boolean,default:false},roomId:String}]
 });

 userSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["email"]});
userSchema.plugin(findOrCreate);
 const User = new mongoose.model("User",userSchema);
 passport.use(User.createStrategy());
 passport.serializeUser(User.serializeUser());
 passport.deserializeUser(User.deserializeUser());

module.exports = User;
