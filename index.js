import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"

mongoose.connect("mongodb://localhost:27017", {
    dbName: "backend",
})
    .then(() => console.log("Database Connected"))
    .catch((e) => console.log(e));

    const userSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: String,
    });

    const User = mongoose.model("User", userSchema)


const app = express();

//Using middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//setting up view Engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token

    if(token){
        const decoded = jwt.verify(token, "kuldeep");
        console.log(decoded)
        req.user = await User.findById(decoded._id);

        next();
    }
    else{
        res.redirect("/login");
    }

}

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.name })
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if(!user) return res.redirect("/register");

    const isMatch = await bcryptjs.compare(password, user.password);
    if(!isMatch) return res.render("login", { email, message:"Incorrect Password"});

    const token = jwt.sign({ _id: user._id}, "kuldeep")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60*100),
    });
    res.redirect("/");
});

app.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    let user = await User.findOne({ email });
    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

     user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign({ _id: user._id}, "kuldeep")

    res.cookie("token", token, {
        httpOnly: true
    });
    res.redirect("/");
});


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

// app.get("/add", async (req, res) => {
//     await msg.create({
//         name:"kuldeep999",
//         email:"sample999@gmail.com"
//     })
//     .then(() => {
//         res.send("Nice");

//     })
// });

app.listen(5000, () => {
    console.log("server is working");
});