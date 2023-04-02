import express, { urlencoded } from "express"
import path from "path"
import fs from "fs"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
const app = express()
const port = 5000;
mongoose.connect("mongodb://localhost:27017", {dbname:"backend"})
.then(()=>{
    console.log("connected");
}).catch((e)=>{
    throw e
})
// schema defines the structure of database
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});
// model creates the collection in database
const User = mongoose.model("user",userSchema);

//setting up middleware
// app.use(express.static(path.join(path.resolve(),"public")));
// app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

//setting view engine
app.set("view engine", "ejs");
const user = []

const isAuthenticated = async (req,res,next)=>{
    const {token} = req.cookies
    if(token){
        const decoded = jwt.verify(token, "skhdalksdhfslksad")
        req.user = await User.findById(decoded._id)
        next();
    }
    else{
        res.redirect('/')
    }
};

app.get("/",(req,res)=>{
    
   res.render("login")
});

app.get("/logout",isAuthenticated,(req,res)=>{
    res.render("logout", {name: req.user.name})
});

app.post("/", async (req,res)=>{  
    const {name,email,password} = req.body
    let user = await User.findOne({email});
    const isMatched = await bcrypt.compare(password,user.password)
  if (!isMatched) {
    return res.render("login", {message: "Invalid Credentials"});
    } 
    else{
    // user = await User.create({name,email})

   const token = jwt.sign({_id:user._id},"skhdalksdhfslksad")
    
   res.cookie("token",token,{
    httpOnly:true,
    expires: new Date(Date.now()+60*1000)
   })
   res.redirect('logout')
    }
});

app.get("/register", (req,res)=>{
    res.render("register")
});

app.post("/register", async (req,res)=>{
    const {name,email,password} = req.body
    let user = await User.findOne({name,email,password})
    if (user) {
        return res.redirect("/");
        } 
    else{
        const hashedPassword = await bcrypt.hash(password,10)
    const user = await User.create({name,email,password:hashedPassword})

   const token = jwt.sign({_id:user._id},"skhdalksdhfslksad")
    
   res.cookie("token",token,{
    httpOnly:true,
    expires: new Date(Date.now()+60*1000)
   })
   res.redirect('logout')}
});

app.post("/logout",(req,res)=>{
    res.cookie("token","null",{
        expires: new Date(Date.now())
       })
   res.redirect("/")
});


app.listen(port, (req,res)=>{
    console.log(`server is running at the port ${port}`);
})