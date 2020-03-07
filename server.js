var express                    = require("express");
var app                        = express();
var bodyparser                 =require("body-parser");
var mongoose                   = require("mongoose");
var passport                   =require("passport");
var localStrategy              =require("passport-local");
var passportLocalMongoose      = require("passport-local-mongoose");
var methodOverride             =require("method-override");
var flash                      =require("connect-flash");

var User                      = require("./models/user");
var Booking                   = require("./models/booking");


app.use(require("express-session")({
    secret:"adventure28",
    resave:false,
    saveUninitialized:false
}));

app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyparser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
mongoose.connect("mongodb://localhost/Conferenceroom");

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  next();
});


var login     = 0;
var cuser     = {name:"guest" , previous_booking:[]};
var pb        = [];
var room1     = [];
var room2     = [];
var dates     = [];
var pantry    = [];



///////////////////
/// Routes ///////
/////////////////

app.get("/",function(req,res){

  console.log("login:-" ,login);
  console.log("pantry:-" ,pantry);
  console.log("dates:-" ,dates);
  console.log("room1:-",room1);
  console.log("room2:-",room2);
  res.render("home",{login:login,cuser:cuser,room1:room1,room2:room2,dates:dates,pb:pb});
});

app.get("/pantry",function(req,res){
  console.log("pantry:-" ,pantry);
  res.render("pantry",{pantry:pantry});
});


app.get("/newuser",function(req,res){
  res.render("newuser");
});

app.get("/newbooking",function(req,res){
  if(login==1){
    res.render("newbooking",{room1:room1,room2:room2});
  }
  else{
    res.redirect("/");
  }
});

app.get("/success",function(req,res){
  res.render("success");
});


///////////////////
// Delete Book ///
/////////////////

app.get("/deletebooking/:id" , function(req,res){

    Booking.findByIdAndDelete(req.params.id,function(err,obj){
      if(err){
          res.redirect("back");
      }
      else{
          console.log("Succefully Deleted");
          console.log("Now executing this");
          preprocessor();
          fillpb();
          console.log("Now redirecting");
          res.redirect("/");
      }
   });


});


//////////////////
// New Booking //
////////////////

function endate(s){
  var t = s.split('/');
  var k = Number(t[2])*10000+Number(t[1])*100+Number(t[0]);
  return k;
}

function entime(s){
  var t = s.split(':');
  var k = Number(t[0])*100+Number(t[1]);
  return k;
}

app.post("/newbooking",function(req,res){
  var book = req.body.a;
  book.ndate = endate(book.date);
  book.nstime = entime(book.stime);
  book.netime = entime(book.etime);
  book.user_id = cuser._id;
  if(book.pantry != "none"){
    book.ispantry = true;
  }
  else{
    book.ispantry = false;
  }

  var t = book.ndate-endate(dates[0]);
  console.log(t);
  if(book.ispantry && t<2){
    pantry[t].push(book);
  }

  if(book.room == "1"){
    room1[t].push(book);
  }
  else{
    room2[t].push(book);
  }

  var k;
  Booking.create(book,function(err,booking){
    if(err){
      console.log(err);
    }
    else{
      console.log(booking);
      k = booking;
      pb.push(k);
      console.log(k);
      res.render("success",{k:k});

    }
  });

});



///////////////////
// Login/Logout //
/////////////////

app.get("/true",function(req,res){
  login = 1;
  cuser = req.user;
  console.log("Login Granted to",cuser);
  Booking.find({user_id:cuser._id},function(err,bookings){
    if(err){
      console.log(err);
    }
    else{
      var k = bookings.slice(0);
      k.sort(compare);
      pb = k;
      res.redirect("/");
    }
  });

});

app.get("/logout",function(req,res){
  req.logout();
  cuser.first = {name:"guest" , previous_booking:[]};
  login = 0;
  res.redirect("/");
});

app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/true",
        failureRedirect: "/"
    }) , function(req, res){
});


/////////////////////////
// User Rigisteration //
///////////////////////



app.post("/userregister",function(req, res) {
    console.log("reg");
    var newUser=new User({
        username:req.body.username,
    });
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.redirect("/newuse");
        }
        passport.authenticate("local")(req,res,function(){
            console.log(user);
            res.redirect("/true");
        });
    });
});


//////////////////////
/// Pre Processor ///
////////////////////

function compare(a,b){
  if(a.ndate>b.ndate) return 1;
  else if(a.ndate<b.ndate) return -1;
  else if(a.stime<b.stime) return 1;
  else return -1;
}

function fillpb(){
  pb = [];
  Booking.find({user_id:cuser._id},function(err,bookings){
    if(err){
      console.log(err);
    }
    else{
      var k = bookings.slice(0);
      k.sort(compare);
      pb = k;
    }
  });
}

function filldate(){
    dates = [];
    for(var i = 0 ; i<7 ; i++){
      var someDate = new Date();
      var numberOfDaysToAdd = i;
      someDate.setDate(someDate.getDate() + numberOfDaysToAdd);
      var dd = someDate.getDate();
      var mm = someDate.getMonth() + 1;
      var y = someDate.getFullYear();
      var date = dd + '/'+ mm + '/'+ y;
      dates.push(date);
   }
}

function fillroom1(){
  room1 = [];
  for(var j = 0; j<7 ; j++)
  room1.push([]);

  console.log(dates);
  for(var i =0 ; i<7 ;  i++){
    var t1 = endate(dates[i]);
    console.log("i",i);
    console.log("t1" , t1);
    var done = false;
    var k = -1;
    Booking.find({ndate:t1,room:'1'}, function(err,bookings){
      k++;
     if(err){
       console.log(err);
     }
     else{
       console.log(k,t1);
       var t = bookings.slice(0);
       t.sort(compare);
       console.log("print",k,t);
       room1[k] = t;
       done = true;
     }
   });

  }
}

function fillroom2(){
  room2 = [];
  for(var i =0 ; i<7 ; i++ ){
     var t2 = endate(dates[i]);
    Booking.find({ndate:t2,room:'2'} , function(err,bookings){
     if(err){
       console.log(err);
     }
     else{
       var t = bookings.slice(0);
       t.sort(compare);
       room2.push(t);

     }
   });
  }
}

function fillpantry(){
  while(pantry.length) pantry.pop();
  for(var i =0 ; i<2 ; i++){
    var t1 = endate(dates[i]);
    Booking.find({ndate:t1,ispantry:true} , function(err,bookings){
     if(err){
       console.log(err);
     }
     else{
       var t = bookings.slice(0);
       t.sort(compare);
       pantry.push(t);
     }
   });
  }

}

function preprocessor(){

  fillpantry();
  fillroom1();
  fillroom2();
}



///////////
//Server//
/////////

app.listen(3000,"127.0.0.1",function(req,res){
   console.log("Conference room server running at 127.0.0.1:.....");
   filldate();
   preprocessor();
});
