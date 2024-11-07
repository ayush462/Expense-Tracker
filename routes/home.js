const express =require("express");
const wrapAsync = require("../utils/wrapAsync");
const User= require("../models/user.js");
const passport = require("passport");
const router = express.Router();
const {savedUrl}= require("../middleware.js")
const Sendbird = require("sendbird")
const sb = new Sendbird({appId: "4F8F0198-177A-4A06-9D39-F4512875A480"})


router.get("/", (req, res) => {
    res.render("./ui/home.ejs", { successMessages: req.flash("success"), errorMessages: req.flash("error") });
});

router.get("/about", (req,res)=>{
    res.render("./user/about.ejs",{successMessages: req.flash("success"),errorMessages: req.flash("error")});
});

router.get("/contact", (req,res)=>{
    res.render("./user/contact.ejs",{successMessages: req.flash("success"),errorMessages: req.flash("error")});
});

module.exports=router;