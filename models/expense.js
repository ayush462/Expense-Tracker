// Expense model (models/expense.js)
const mongoose = require("mongoose");

const expenditureSchema = new mongoose.Schema({
    description: String,
    amount: Number,
    date: { type: Date, default: Date.now },
    icon: String,
    color: String,
});

const transactionSchema = new mongoose.Schema({
    amount: Number,
    date: { type: Date, default: Date.now },
    description: String,
    action: String,
});

const expenseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    total: { type: Number, default: 0 },
    expenditures: [expenditureSchema],
    transactions: [transactionSchema], // Add this field
    lastUpdated: Date,
});

module.exports = mongoose.model("Expense", expenseSchema);
