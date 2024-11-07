const express =require("express");
const wrapAsync = require("../utils/wrapAsync");
const User= require("../models/user.js");
const Expense = require("../models/expense.js")
const passport = require("passport");
const router = express.Router();
const OTP = require("../models/OTP.js")
const {savedUrl, isLoggedIn}= require("../middleware.js")
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender.js");
const mailTemplate = require("../mail/templates/emailVerificationTemplate.js")


router.get("/signup",(req,res)=>{
    res.render("./user/signup.ejs");
});

router.post("/signup", wrapAsync(async(req, res, next) => {
    let { username, email, password } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        req.flash("error", "Email is already present. Please use a different email.");
        return res.redirect("/signup"); // Redirect back to signup
    }

    // Generate otp and save to the otp model 
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    await OTP.create({ email, otp });

    // Send otp on email 
    const title = "Verification mail";
    await mailSender(email, title, mailTemplate(otp));
    console.log("OTP sent successfully and OTP is", otp);

    // Store user data temporarily in session 
    req.session.tempUserData = { username, email, password };

    req.flash("info", "An OTP has been sent to your email for verification.");
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
}));


//rendring otp verification page where we have to enter otp 
router.get("/verify-otp", (req, res)=>{
    const {email}= req.query || req.body || req.params;
    res.render("./user/verify-otp.ejs",{email});

})


//verify otp and comeplete sighnup 

router.post("/verify-otp", wrapAsync(async(req, res, next)=>{
    const{email, otp} = req.body;

    //find otp in the database
    const otpRecord =  await OTP.findOne({email, otp});

    if(!otpRecord){
        req.flash("error", "Invalid Or expired OTP, please Try again ");
        return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    // if otp is valid , then delete kro database me se 
    await  OTP.deleteOne({email, otp});

    //register kro user ko data saved in the session ke sath 
    const{username, password} = req.session.tempUserData;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);

    //clera kro temperory data form session 

    // log the user in and redirect 
    req.login(registeredUser, (error)=>{
        if(error) return next(error);
        req.flash("success", "Account Created Successfully!")
        res.redirect("/home");

    })



}))

router.get("/login",(req,res)=>{
    res.render("./user/login.ejs");
});

router.post("/login",savedUrl,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),async(req,res)=>{
    req.flash("success","welcome back to Expense Tracker!");
    let redirectUrl=res.locals.redirectUrl || "/home"
    res.redirect(redirectUrl);
})

router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are logged out!");
        res.redirect("/home");
    })
})


//Profile route to display unhashed username, email, and password
router.get("/profile", isLoggedIn, (req, res) => {
    // Use session data if available, otherwise req.user
    const { username, email } = req.session.tempUserData || req.user;
    
    res.render("./ui/profile.ejs", {
        username,
        email,
        successMessages: req.flash("success"),
        errorMessages: req.flash("error"),
        
    });
});

// DELETE route for deleting the user profile
router.delete("/profile", isLoggedIn, wrapAsync(async (req, res) => {
    const userId = req.user._id; // Get the current user's ID
      
    await Expense.deleteMany({ user: userId });

    // Delete the user from the database
    await User.findByIdAndDelete(userId);
    
    // Log the user out
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Your account has been deleted successfully.");
        res.redirect("/"); // Redirect to home or a suitable page
    });
}));
module.exports=router;