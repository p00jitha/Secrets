const express = require('express');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const app = express()

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/user-auth", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

const User = new mongoose.model("User",userSchema);

app.get('/',function(req,res){
    res.render('home');
})

app.get('/login',function(req,res){
    res.render('login');
})

app.get('/register',function(req,res){
    res.render('register');
})

app.post('/register',async(req,res) => {
    const {username,password} = req.body;
    try{
        const hashedpassword =  await bcrypt.hash(password, 10);
        const newUser = new User({
            email:username,
            password:hashedpassword
        });
        await  newUser.save();
        console.log('user registered');
        res.render('login');
    }
    catch(err){
        console.log(err);
        res.status(500).send('Registration failed');
    }
});

app.post('/login',async(req,res)=>{
    const {username,password} = req.body;
    try{
        const user = await User.findOne({email:username});
        if(user){
            const passwordMatch = await bcrypt.compare(password, user.password);
            if(passwordMatch){
                res.render('secrets');
            }
            else
            {
                res.status(401).send('Incorrect password');
            }
        }
        else
        {
            res.status(401).send('User not found');
        }
    }catch(err){
           console.log(err);
           res.status(500).send('Login failed');
    }
});

app.listen(8000,()=>{console.log('server is running')})