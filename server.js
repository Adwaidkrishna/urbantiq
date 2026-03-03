const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config();

const app= express()

//B-parser
app.use(express.json()) //allows parsing of nested objects and arrays (using qs library).
app.use(express.urlencoded({extended:true}))

//static folder
app.use(express.static(path.join(__dirname,"public")))//It serves static files directly to the client 

//view engine 
app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))

//DB connection
require("./config/db")();

//default route 
app.get('/',(req,res)=>{
    res.send("URBANIQ Backend Running 🚀")
});

const PORT=process.env.PORT||5000

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})