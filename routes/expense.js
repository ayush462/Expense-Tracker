const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const User = require("../models/user.js");
const Expense = require("../models/expense.js");
const passport = require("passport");
const router = express.Router();
const { savedUrl, isLoggedIn } = require("../middleware.js");
const cron = require("node-cron")

// Function to generate a random color in hex format
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
cron.schedule('0 0 1 * *', async () => {
    try {
        const expenses = await Expense.find(); // Get all expenses
        expenses.forEach(async (expense) => {
            const healthAmount = expense.total * 0.2; // Calculate 20% of total
            expense.expenditures.push({
                description: "Health Expenditure",
                amount: healthAmount,
                icon: "fa-heart", // Example icon, you can change it
                color: getRandomColor()
            });
            expense.total -= healthAmount; // Deduct from total
            expense.lastUpdated = Date.now();
            await expense.save();
        });
        console.log("Health expenditure has been allocated for the month.");
    } catch (error) {
        console.error("Error allocating health expenditure:", error);
    }
});

// GET route to render the expense page with the current total and expenditures for the logged-in user
router.get("/expense", isLoggedIn, async (req, res) => {
    try {
        const expense = await Expense.findOne({ user: req.user._id }); 
        const total = expense ? expense.total : 0; 
        const expenditures = expense ? expense.expenditures : []; 
        
        res.render("./ui/expense.ejs", { 
            successMessages: req.flash("success"), 
            errorMessages: req.flash("error"), 
            total: total,
            expenditures: expenditures 
        });
    } catch (error) {
        console.error("Error fetching expense:", error);
        req.flash("error", "Could not retrieve expenses.");
        res.redirect("/"); 
    }
});

// POST route to update the total for the logged-in user
// POST route to update the total for the logged-in user
router.get("/update-total",isLoggedIn, (req,res)=>{
    res.render("./ui/update-total.ejs",{ successMessages: req.flash("success"), errorMessages: req.flash("error") })
})
router.post("/update-total", isLoggedIn, async (req, res) => {
    const { total } = req.body; // This will contain the total passed from the client
    try {
        const amount = parseFloat(total);
        const expense = await Expense.findOne({ user: req.user._id });

        if (expense) {
            // Add a transaction entry for the total update
            expense.transactions.push({
                amount: amount,
                description: "Total updated",
                action: "update",
            });

            expense.total += amount; // Add the incoming amount to the existing total
            expense.lastUpdated = Date.now();
            await expense.save();
            req.flash("success", "Total updated successfully.");
        } else {
            const newExpense = new Expense({
                total: amount,
                user: req.user._id,
                lastUpdated: Date.now(),
                transactions: [{ amount, description: "Total created", action: "create" }],
            });
            await newExpense.save();
            req.flash("success", "Total created successfully.");
        }
        res.redirect("/expense");
    } catch (error) {
        console.error("Error updating total:", error);
        req.flash("error", "Could not update the total.");
        res.status(500).json({ success: false }); // Respond with error
    }
});




router.get("/transaction", isLoggedIn, async (req, res) => {
    try {
        const expense = await Expense.findOne({ user: req.user._id });
        const transactions = expense ? expense.transactions : []; // Ensure transactions is defined
        res.render("./ui/transaction.ejs", {
            successMessages: req.flash("success"),
            errorMessages: req.flash("error"),
            transactions: transactions // Pass transactions to the template
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        req.flash("error", "Could not retrieve transactions.");
        res.redirect("/");
    }
});

// GET route to render add expenditure form
router.get("/add-expenditure", isLoggedIn, (req, res) => {
    res.render("./ui/add-expenditure.ejs", { successMessages: req.flash("success"), errorMessages: req.flash("error") });
});

// POST route to add an expenditure for the logged-in user
// POST route to add an expenditure for the logged-in user
router.post("/add-expenditure", isLoggedIn, async (req, res) => {
    const { description, amount, icon } = req.body;
    const customIcon = req.body.customIcon.trim();
    try {
        const amountValue = parseFloat(amount);

        if (amountValue <= 0) {
            req.flash("error", "Please enter a positive amount.");
            return res.redirect("/expense");
        }

        const expense = await Expense.findOne({ user: req.user._id });

        if (expense) {
            const existingExpenditure = expense.expenditures.find(exp => exp.description === description);

            if (existingExpenditure) {
                existingExpenditure.amount += amountValue;
                req.flash("success", "Expenditure updated successfully.");
            } else {
                const color = getRandomColor();
                expense.expenditures.push({
                    description,
                    amount: amountValue,
                    icon: customIcon || icon || "fa-shopping-cart",
                    color: color
                });
                req.flash("success", "Expenditure added successfully.");
            }

            expense.total -= amountValue;
          
            expense.lastUpdated = Date.now();
            await expense.save();
        } else {
            req.flash("error", "No expense document found for this user.");
        }

        res.redirect("/expense");
    } catch (error) {
        console.error("Error adding or updating expenditure:", error);
        req.flash("error", "Could not add or update the expenditure.");
        res.redirect("/");
    }
});
// POST route to clear all expenditures for the logged-in user
router.post("/clear-expenditures", isLoggedIn, async (req, res) => {
    try {
        const expense = await Expense.findOne({ user: req.user._id });

        if (expense) {
            // Clear the expenditures and reset total
            expense.expenditures = [];
             // Adjust total accordingly
            expense.lastUpdated = Date.now(); // Update the last updated timestamp
            
            await expense.save();
            req.flash("success", "All expenditures cleared successfully.");
        } else {
            req.flash("error", "No expense document found for this user.");
        }

        res.redirect("/expense");
    } catch (error) {
        console.error("Error clearing expenditures:", error);
        req.flash("error", "Could not clear expenditures.");
        res.redirect("/"); // Redirect on error
    }
});
// POST route to clear all transactions for the logged-in user
router.post("/clear-transactions", isLoggedIn, async (req, res) => {
    try {
        const expense = await Expense.findOne({ user: req.user._id });

        if (expense) {
            // Clear the transactions and reset total if necessary
            expense.transactions = [];
            // Optionally, if you want to keep the total as is, comment the next line
            // expense.total = 0; // Uncomment if you want to reset total to 0 when clearing transactions
            expense.lastUpdated = Date.now(); // Update the last updated timestamp
            
            await expense.save();
            req.flash("success", "All transactions cleared successfully.");
        } else {
            req.flash("error", "No expense document found for this user.");
        }

        res.redirect("/transaction"); // Redirect to the transactions page after clearing
    } catch (error) {
        console.error("Error clearing transactions:", error);
        req.flash("error", "Could not clear transactions.");
        res.redirect("/"); // Redirect on error
    }
});




module.exports = router;
