require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const http=require("http");
const passport = require('passport');
 const session = require("express-session");
 const {Server} = require('socket.io');
 const passportLocalMongoose = require('passport-local-mongoose');
 var User = require('./models/usermodel.js');
 var Group = require('./models/groupmodel.js');
 var requireLogin = require('./middleware/requireLogin.js');

const app = express();
app.use(cors({
  origin:"http://localhost:3000"
}));
app.use(bodyParser.json());

app.use(require("./routes/auth.js"))
app.use(require("./routes/myprofilebar.js"))
app.use(require("./routes/group.js"))

const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"http://localhost:3000",
    method:['GET','POST'],
    credentials:true,
    allowedHeaders: ["access-token"],
  },
});


io.on('connection',(socket)=>{
  // console.log(`connected ${socket.id}`);

  socket.on("join_room",(data)=>{
      // console.log("room joined");

    socket.join(data);
    // console.log(socket.rooms);
  })

socket.on("send_group_message",(data)=>{

  Group.findOne({_id:data.groupId},(err,group)=>{
    const message = {
      sender:data.me,
      body:data.body,
      time:data.time,
      group:true,
      date:data.date
    }
    // console.log(message);
    group.messages.unshift(message);
    group.save();
    socket.to(data.roomId).emit("recieve_message",message)
  })
})
  socket.on("send_message",(data)=>{
// console.log(data);
User.findOne({email:data.senderMail},(err,user)=>{
  const messageData = {
    senderMail:data.receiverMail,
    body:data.body,
    time:data.time,
    roomId:data.roomId,
    date:data.date
  }
  user.messages.unshift(messageData);
  user.save();
  User.findOne({email:data.receiverMail},(err,userr)=>{
    const receiverMessage = {
      senderMail:data.senderMail,
      sender:data.me,
      body:data.body,
      time:data.time,
      roomId:data.roomId,
      date:data.date
    }

    // console.log(data);
    userr.messages.unshift(receiverMessage);
    userr.save();
socket.to(data.roomId).emit("recieve_message",receiverMessage)

  })
})
  })

socket.on('forceDisconnect',function(room){
  try{
    // console.log('[socket]','leave room :', room);
    socket.leave(room);
  }catch(e){
    // console.log('[error]','leave room :', e);
  }
})


socket.on("destroyConnection", (data) => {
  // console.log( 'this',data);
  socket.to(data).emit("connectionbreak",{destroy:true})
})

  socket.on("roomId",async (data) => {
    // console.log(data);

    const sockets = await io.in(data).fetchSockets();
    const socketIds = sockets.map(socket => socket.id);

    // console.log(socketIds);
    await io.emit("calledto",socketIds)
  })

	socket.on("callUser", (data) => {
    // console.log("happening",data.userToCall);
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})

})

app.get("/users",requireLogin,(req,res)=>{
Group.find({},(err,groups)=>{
  var users=[];
  User.find({},(err,data)=>{
    if(err) return res.json({success:false,message:err});
    if(data.length!==0){
      data.forEach((userdata)=>{
        if(req.user.email!==userdata.email){
          const user = {
          image:userdata.image && userdata.image,
          email:userdata.email,
          firstname:userdata.firstname ?userdata.firstname:userdata.username,
          lstMessage:null
        }
        users.push(user);
      }
      })
    }
    if(groups.length!==0){
      groups.forEach(group=>{
        if (group.users.includes(req.user.email)) {
          users.push(group);
        }
      })
    }
    // console.log(users);
    res.json(users);
  })
})
})

app.get("/getmessages",requireLogin,(req,res)=>{
  res.send(req.user.messages);
})

app.get("/chart",(req,res)=>{
  var arr = [];
  User.find({},(err,users)=>{
    users.forEach((userdata)=>{

        const user = {
        firstname:userdata.firstname ?userdata.firstname:userdata.username,
        messages:userdata.messages.length
      }
      arr.push(user);

    })
    res.json(arr);
  })

})

app.get("/mygroups",requireLogin,(req,res)=>{
  var grp = [];
  Group.find({},(err,groups)=>{
    groups.forEach((group)=>{

        if(group.users.includes(req.user.email)){
          const temp = {
          firstname:group.firstname ?group.firstname:group.username,
          messages:group.messages.length
        }
        grp.push(temp);
        }

    })

    res.json(grp);
  })

})

  var data=[];

app.post("/groupUsers",(req,res)=>{
  data=[];

  Group.findOne({_id:req.body.id},(err,grp)=>{

    grp.users.forEach(email=>{
      User.findOne({email:email},(err,user)=>{
        const obj={
          firstname:user.firstname,
          image:user.image
        }
        data.push(obj);
        if(grp.users[grp.users.length - 1]===email){
          res.json({success:true})
        }
      });
    });
  });
});

app.get("/getgrpusers",(req,res)=>{
  res.json(data);
})


server.listen(process.env.PORT || "4000",(req,res)=>{
  console.log("running on port 4000");
})
