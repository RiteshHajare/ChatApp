const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  firstname:String,
  image:{type: String, default: 'images/defaultProfile.png'},
  roomId:String,
  users:[String],
  lstMessage:{type:String,default:null},
  messages:[{date:String,sender:String,body:String,time:String,seen:{type:Boolean,default:false},group:{type:Boolean,default:true}}]
})

const Group = new mongoose.model("group",groupSchema);

module.exports = Group;
