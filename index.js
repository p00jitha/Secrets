require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express()
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
   email:{
    type:String,
    unique:true
   },
   password:String,
   secret:String
});
const User = new mongoose.model("User",userSchema);
app.use(cookieParser());
app.use(
    session({
        secret:process.env.SECRET,
        resave: false,
    saveUninitialized: false,
    })
);

app.get('/',function(req,res){
    res.render('home');
})

app.get('/login',function(req,res){
    res.render('login');
})
 
app.get('/register',function(req,res){
    res.render('register');
}) 

app.get('/forgot',(req,res)=>{
    res.render('forgot');
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
                req.session.user = user;
                User.find({ secret: { $ne: null } })
        .then(foundUsers => {
            res.render('secrets', { usersWithSecrets: foundUsers });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error fetching user secrets');
        });
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


app.post('/forgot',async(req,res)=>{
const {username,password} = req.body;
try{
    const user = await User.findOne({email:username});
    if(user){
        const newpassword = await bcrypt.hash(password, 10);
        User.updateOne({ email: username }, { $set: { password: newpassword } })
       .then(() => {
           res.render('login')
       })
       .catch(err => {
          console.log(err)
       });
    }
    else
    {
            res.status(401).send('User not found');
    }
}
catch(err){
    console.log(err);
    res.status(500).send('failed to change password');
}

})

app.get('/submit',(req,res)=>{
    if(req.session.user){
        res.render('submit');
    }
    else{
        res.redirect('/login');
    }
})

app.post('/submit',(req,res)=>{
    const submitsecret=req.body.secret;
    const userid = req.session.user._id;
    User.findById(userid)
    .then(found=>{
       found.secret=submitsecret;
       found.save()
       .then(docs=>{

        User.find({ secret: { $ne: null } })
        .then(foundUsers => {
            res.render('secrets', { usersWithSecrets: foundUsers });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error fetching user secrets');
        });
       })
       .catch(err=>{
        console.log(err)
       })
    })
    .catch(err =>{
        console.log(err);
    })
})

app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err)
        {
            console.log(err);
        }
        res.redirect('/login');
    });
});

app.listen(8000,()=>{console.log('server is running')})