const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path")
const mongoose = require("mongoose");
const methodOverride = require("method-override")
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const users = require("./routes/user.js");
const home = require("./routes/home.js")
const expense = require("./routes/expense.js")
const passport =require("passport");
const localstratgy=require("passport-local");
const user = require("./models/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const database = require('./config/database.js')
const Sendbird = require("sendbird")
require("dotenv").config()
database();


const SessionOption={
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 *1000,
        maxAge:7 * 24 * 60 * 60 *1000,
        httpOnly:true,
    },
}
app.use(passport.initialize());
passport.use(new localstratgy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());



app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"public")));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.engine("ejs",ejsmate);

app.get("/",(req,res)=>{
    res.redirect('/home')
})



app.use(session(SessionOption));
app.use(passport.session());
app.use(flash());
app.use((req,res,next)=>{
  res.locals.success= req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
})

app.use("/home", home)
app.use("/",users)
app.use("/",expense)
app.use("/",home)




app.all("*", (req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});  

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong!" } = err;
    res.status(statusCode);
    if (res.render) {
        res.render('error', { message: message, statusCode: statusCode });
    } else {
        res.send(message);
    }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
