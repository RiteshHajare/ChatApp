const express = require('express');
const mongoose = require('mongoose');
var Group = require('../models/groupmodel.js');
const app = express();


app.post("/group",(req,res)=>{
  // console.log(req.body);
  const group = new Group({
    firstname:req.body.firstname,
    image:req.body.image && req.body.image,
    roomId:req.body.roomId,
    users:req.body.users
  })
  group.save().then(group=>{
    res.json(group);
  })
})

app.post("/groupmessages",(req,res)=>{
  Group.findOne({_id:req.body._id},(err,group)=>{
    res.json(group.messages);
  })
})

module.exports = app;
