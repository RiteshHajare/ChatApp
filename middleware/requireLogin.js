require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var User = require('../models/usermodel.js');

module.exports = (req,res,next)=>{
  const{authorization} = req.headers;
  if(!authorization){
    return res.json({success:false,message:"Failed login middleware testcase 1."})
  }
  const token = authorization.replace("Bearer ","")
  jwt.verify(token,process.env.JWT_SECRET,(err,payload)=>{
    if(err){
      return res.json({success:false,message:"Failed login middleware testcase 2."})
    }
  
    const {_id} = payload;
    User.findById(_id).then(userdata=>{
      req.user = userdata;
      next();
    })
  })
}
