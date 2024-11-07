
//creating for mail send

const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body)=>{
    try{
        // createing trasporter 
        let transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth :{
                user:process.env.MAIL_USER,
                pass :process.env.MAIL_PASS
            }
        })

        //SEND MAIL
        let info = transporter.sendMail({
            from: "Expense Tracker || JSR",
            to: `${email}`,
            subject: `${title}`,
            html :`${body}`
        })  

        console.log(info)
        return info
    }catch(error){

        console.log("error while sending mail", error.message)
    }
}

module.exports = mailSender;
