

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser")
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express()



app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false


}));

app.use(passport.initialize());
 app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/pollingDB",{ useNewUrlParser: true , useUnifiedTopology: true ,useCreateIndex: true});

const pollingSchema = new mongoose.Schema({
  email:String,
  password:String,
  facebookId:String,
  // details:{
     name:String
     // group:String

   //   address:String,
   //   state:String
   // }
});


pollingSchema.plugin(passportLocalMongoose);
pollingSchema.plugin(findOrCreate);

const User = new mongoose.model("User",pollingSchema);



passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/participate",
     profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);

    });
  }
));







const namess =[];

app.get("/",function(req,res){
  res.render("home");
})

app.get('/auth/facebook',
  passport.authenticate('facebook', {  authType: 'rerequest',scope: ["email"] }));


  app.get("/auth/facebook/participate",
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/participate');
  });






app.get("/login",function(req,res){
  res.render("login");
})




app.get("/register",function(req,res){
  res.render("register");
});

app.get("/participate",function(req,res){
  if(req.isAuthenticated()){
    res.render("participate");
  }else{
    res.redirect("/login");
  }
});




app.post("/register",function(req,res){
  User.register({username:req.body.username}, req.body.password, function(err,user){
   if(err){
     console.log(err);
     res.redirect("/register");
   }else{
   passport.authenticate("local")(req,res,function(){
     res.redirect("/participate");
   });
 }
});

});


app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err) {
    if (err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/participate");
      });
    }

  });
    // console.log(req.user.id);
});



app.post("/participate",function(req,res){
const submiteddetails = req.body.name;
console.log(submiteddetails);
console.log(req.user.id);

User.findById(req.user.id,function(err,foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      foundUser.name == submiteddetails;
      foundUser.save(function(){
          console.log("added data to databse");
          res.redirect("/candidates");

      })
    }
  }
});

});







//
// const person = new Person({
//   name: req.body.name,
//   email: req.body.email,
//   group:req.body.group,
//   about: req.body.about,
//   sddress: req.body.address,
//   state: req.body.state
// })
//
// person.save(function(err){
//   if(!err){
//     res.redirect("/candidates");
//   }
// });









app.get("/candidates",function(req,res){
  // if(req.isAuthenticated()){
  //   res.render("candidates");
  // }else{
  //   res.redirect("/login");
  // }
  res.render("candidates");
});

























///////////////////////////////////////////////////////////////////
app.listen(3000,function(){
console.log("server is running on port 3000");
})
