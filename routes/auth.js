require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');
const session = require("express-session");
const axios = require('axios');
const jwt = require('jsonwebtoken');
var User = require('../models/usermodel.js');
var requireLogin = require('../middleware/requireLogin.js');
var findOrCreate = require('mongoose-findorcreate');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var GitHubStrategy = require('passport-github2').Strategy;
const app = express();
var otp;


const nextDay = 1000*60*60*24;
app.use(session({
  secret:process.env.SECRET,
  saveUninitialized:true,
  cookie:{maxAge:nextDay},
  resave:true
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


app.use(passport.initialize());
app.use(passport.session());

app.post("/email",(req,res)=>{
  const{email} = req.body;


  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testmail19253@gmail.com',
      pass: process.env.MY_PASS
    }
  });
  otp = Math.floor(1000 + Math.random() * 9000);
  otp=String(otp);
  var mailOptions = {
    from: 'testmail19253@gmail.com',
    to: email,
    subject: 'OTP from ChatApp',
    text: otp
  };

  User.findOne({username:req.body.username})
  .then((saveduser)=>{
    if(saveduser){

      if(saveduser.email.toUpperCase()===req.body.email.toUpperCase()){
        return res.json({success:false,message:"User with username and email already exists."});

      }else{
        return res.json({success:false,message:"User with username already exists."});
      }
    }else{
      User.findOne({email:req.body.email.toUpperCase()})
      .then((founduser)=>{
        if(founduser){
          return res.json({success:false,message:"User with email already exists."});
        }else{
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              // console.log(error);
            } else {
              // console.log('Email sent: ' + info.response);
              res.status(200).json({success:true,message:"User can be verified with email otp."});
            }
          });
        }
      })

    }
  })
})

app.post("/otp",(req,res)=>{
  if(req.body.otp===otp){
    res.json({success:true,message:"User verified."});
  }else{
    res.json({success:false,message:"User not verified."});
  }
})

app.post("/regisdata",(req,res)=>{

    Users=new User({email: req.body.email.toUpperCase(), username : req.body.username,firstname:req.body.firstname,lastname:req.body.lastname});
    User.register(Users, req.body.password, function(err, user) {
      if (err) {
      return  res.json({success:false, message: "This mail is already registered.",err:err})
      }else{
        const token = jwt.sign({_id : user._id}, process.env.JWT_SECRET)
      return  res.json({success: true, message: "Your account successflully created.",_id:user._id,token:token})
      }
    });
});
// FOR TESTING ONLY//////////////////////////////////////////////////////////////////////
app.get("/test",requireLogin,(req,res)=>{

  res.send(req.user);
})

app.post("/loginform",(req,res)=>{
  passport.authenticate('local',
(err, user, info) => {
  if (err) {
    res.json({success:false,message:"this"+ err});
    return;
  }

  if (!user) {
    res.json({success:false,message:"Wrong Credentials"});
    return;
  }

  req.logIn(user, function(err) {
    if (err) {
      res.json({success:false,message:"this2"+err});
      return;
    }else{
          const token = jwt.sign({_id : user._id}, process.env.JWT_SECRET)
          res.json({success:true, message:"Authentication successful", token: token });
    }
  });
})(req, res);
});

app.post("/verifymail",(req,res)=>{
  const{email} = req.body;

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testmail19253@gmail.com',
      pass: process.env.MY_PASS
    }
  });
  otp = Math.floor(1000 + Math.random() * 9000);
  otp=String(otp);
  var mailOptions = {
    from: 'testmail19253@gmail.com',
    to: email,
    subject: 'Password Reset OTP from ChatApp',
    text: otp
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      // console.log(error);
    } else {
      // console.log('Email sent: ' + info.response);
      res.status(200).json({success:true,message:"User can be verified with email otp for Changepassword."});
    }
  });

})

app.post("/changepassword",(req,res)=>{
  // console.log(req.body.email.toUpperCase());
  User.findOne({email:req.body.email.toUpperCase()}).then(function(sanitizedUser){
      if (sanitizedUser){
          sanitizedUser.setPassword(req.body.newPass, function(){
              sanitizedUser.save();
              res.status(200).json({success:true,message: 'password reset successful'});
          });
      } else {
          res.json({success:false,message: 'This user does not exist'});
      }

  })

})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://newchatapp-mn65.onrender.com/transithome",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    var usermail = profile._json.email.toUpperCase();
    User.findOne({email:usermail},(err,user)=>{
      if(user){
        return cb(err, user);
      }else{
        User.findOrCreate({ username: usermail, googleId: profile.id, }, function (err, user) {
          user.firstname = profile._json.given_name;
          user.lastname = profile._json.family_name;
          user.email = usermail;
          user.image = profile._json.picture;
          user.save();
          return cb(err, user);
        });

      }
    })

  }
));

app.get('/googleauth',
  passport.authenticate('google', { scope: ['profile', "email"] }));

app.get('/transithome',(req,res)=>{
    passport.authenticate('google',(err,user,info)=>{
      // console.log(user);
      const oAuth = jwt.sign({_id : user._id}, process.env.JWT_SECRET);
     res.redirect( "https://lighthearted-kleicha-499492.netlify.app/home?token="+oAuth);
    })(req,res);
  });



passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://newchatapp-mn65.onrender.com/githubtohome",
    scope: ["user:email"]
  },
  function(accessToken, refreshToken, profile, done) {
    const mail = profile.emails[0].value.toUpperCase();
    console.log(profile);
    User.findOne({email:mail},(err,user)=>{
      if(user){
        return done(err, user);
      }else{
        User.findOrCreate({ githubId: profile.id }, function (err, user) {
          user.username = profile._json.login;
          user.firstname = profile._json.name;
          user.email = mail;
          user.image = profile._json.avatar_url;
          user.save();
          return done(err, user);
        });
      }
    })

  }
));

app.get('/githubauth',

  passport.authenticate('github', { scope: [ 'user:email' ] }));

  app.get('/githubtohome',(req,res)=>{
      passport.authenticate('github',(err,user,info)=>{
        // console.log(user);
         const oAuth = jwt.sign({_id : user._id}, process.env.JWT_SECRET);
        res.redirect( "https://lighthearted-kleicha-499492.netlify.app/home?token="+oAuth);
      })(req,res);
    });

    app.get("/logout",(req,res)=>{
      req.logout((err)=>{
          if(err) console.log(err);
          else return res.json({success:true,message:"User logout successflully"})
      });
    })



module.exports = app;
