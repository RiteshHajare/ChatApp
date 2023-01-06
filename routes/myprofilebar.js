const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
var User = require('../models/usermodel.js');
var requireLogin = require('../middleware/requireLogin.js');

const app = express();

app.use(bodyParser.json());

app.post("/myprofiledatabase",requireLogin,async(req,res)=>{
  const{ firstname,lastname} = req.body;
  console.log(firstname);
  await User.findOne({username:req.user.username}).then((user)=>{
    if(firstname!==undefined){
      user.firstname=firstname;
    }else if(lastname!=undefined){
       user.lastname=lastname;
    }

  user.save();
  })

})
app.post("/myimg",requireLogin,async(req,res)=>{
  const{ image} = req.body;

  await User.findOne({email:req.user.email}).then((user)=>{
    user.image=image;
  user.save();
  })

})



module.exports = app;
