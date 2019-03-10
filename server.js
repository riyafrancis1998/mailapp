var mysql = require('mysql');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'mailtest'
});

var connect = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'company'
});

connection.connect(function(err){
    if(!err){
        console.log("Database is connected ... nn");
    }
    else{
        console.log("Error connecting database .... nn");
    }
});

connect.connect(function(err){
  if(!err){
      console.log("Database is connected ... nn");
  }
  else{
      console.log("Error connecting database .... nn");
  }
});

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use('/public', express.static(path.join(__dirname, 'public')));

const exphbs = require('express-handlebars');
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.set("view engine","ejs");
app.engine('handlebars', exphbs());
app.get("/",function(req,res){
    res.render("login");
});
app.post("/register",function(req,res){
  var today = new Date();
  let hash = bcrypt.hashSync(req.body.password,12);
  var users={
    "firstname":req.body.firstname,
    "lastname":req.body.lastname,
    "email":req.body.email,
    "password":hash,
    "phoneno":req.body.phone_no
  }
  const output='<p>Verified</p>';
  let transporter = nodemailer.createTransport({
    service:'Gmail',
    auth: {
        user: req.body.email, // generated ethereal user
        pass: req.body.password  // generated ethereal password
    }
  });
  let mailOptions = {
    from: '"'+req.body.firstname+'"<'+req.body.email +'>', // sender address
    to: ''+req.body.email+'', // list of receivers
    subject: 'Verify', // Subject line
    text: 'Verify', // plain text body
    html: output // html body
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
     
     res.send("Enter appropriate email and password");
    return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);   
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
    if (error) {
      console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      console.log('The solution is: ', results);
      res.render('home', {msg:'Email has been sent'});
    }
    });

  
});
});

app.get("/login",function(req,res){
  res.render('login');
});
app.get("/signup",function(req,res){
  res.render('signup');
});
app.post("/sent",function(req,res){
  var email = req.body.email;
  connection.query("select * from messages where status ='sent' and emailsender = ? ",[email],function(error,result,fields){
    if(error){
      res.send({
        "code":400,
        "failed":"error occured"
      })
    }else{
      console.log('Inside Sent emails');
      console.log(result);
      result.push(req.body.email);
      result.push(req.body.password);
      result.push(result[0].sendername);
      result.push('sent');
      console.log(result);
      res.render('outbox',{result:result});
    }

  });
});
app.post("/senddraft",function(req,res){
  var today = new Date();
  console.log("Reached");
  var messages = {
    "fromsender":req.body.fromsender,
    "toreceiver":req.body.toreceiver,
    "emailsender":req.body.email,
    "sendername":req.body.sender,
    "status":"draft",
    "date":today,
    "subject":req.body.subject,
    "text":req.body.text,
    "Messages":req.body.message
  };
  if (req.body.subject!=''){
  connection.query('INSERT INTO messages SET ?',messages, function (error, results, fields) {
    console.log(results);
    if (error) {
      console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      console.log("successfully inserted");
      }
    });
  }
    connection.query("select * from messages WHERE status='sent' or status='draft' and emailsender = ?",[req.body.email],function(err,result,fields){
      if (err) throw err;
      console.log(result);
      console.log(result.length);
      result.push(req.body.email);
      result.push(req.body.password);
      result.push(result[0].sendername);
      console.log(result[0].sendername);
      result.push('All');
      console.log(result);
      res.render('outbox',{result:result});
    });
});
app.post("/draft",function(req,res){
  connection.query("select * from messages WHERE status='draft' and emailsender = ?",[req.body.email],function(err,result,fields){
    if (err) throw err;
    console.log(result);
    console.log(result.length);
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    console.log(result[0].sendername);
    result.push('draft');
    console.log(result);
    res.render('outbox',{result:result});
  });
});
app.post("/outbox",function(req,res){
  connection.query("select * from messages WHERE status='sent' or status='draft' and emailsender = ?",[req.body.email],function(err,result,fields){
    if (err) throw err;
    console.log(result);
    console.log(result.length);
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    console.log(result[0].sendername);
    result.push('All');
    console.log(result);
    res.render('outbox',{result:result});
  });
});
app.post("/loginenter",function(req,res){
    var email= req.body.email;
  var password = req.body.password;
  let hash = bcrypt.hashSync(password,12);
  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
  if (error) {
    // console.log("error ocurred",error);
    res.send({
      "code":400,
      "failed":"error ocurred"
    })
  }else{
    // console.log('The solution is: ', results);
    if(results.length >0){
      if(bcrypt.compareSync(req.body.password,results[0].password)){
        connection.query("select * from messages WHERE status='sent' or status='draft' and emailsender = ?",[email],function(err,result,fields){
          if (err) throw err;
          console.log(result);
          console.log(result.length);
          result.push(req.body.email);
          result.push(req.body.password);
          result.push(result[0].sendername);
          console.log(result[0].sendername);
          result.push('All');
          console.log(result);
          res.render('outbox',{result:result});
        });
         
      }
      else{
        res.send({
          "code":204,
          "success":"Email and password does not match"
            });
      }
    }
    else{
      res.send({
        "code":204,
        "success":"Email does not exits"
          });
    }
  }
  });

});


// compose button will be placed on outbox page and then to the compose page and then from the compose page will be send
app.post('/send', (req, res) => {
  console.log(req.body.sender);
  var email= req.body.email;
  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
    console.log(results);
    if (error) {
      // console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }
    
      else{
        console.log(email);
        const output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Name: XYZ</li>
      <li>Company:Pehchan</li>
      <li>Email:pehchan@gmail.com</li>
      <li>Phone:0222892939/li>
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>`;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // host: 'smtp.mail.gmail.com',
    // port: 587,
    // secure: true, // true for 465, false for other ports
    service:'Gmail',
    auth: {
        user: results[0].email, // generated ethereal user
        pass: req.body.password  // generated ethereal password
    }
    // tls:{
    //   rejectUnauthorized:false
    // }
  });
  connect.query('SELECT * FROM client WHERE sender = ?',[results[0].email], function (error, results, fields) {

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"'+results[0].Name+'"<'+results[0].sender +'>', // sender address
      to: ''+results[0].client+'', // list of receivers
      subject: ''+req.body.subject+'', // Subject line
      text: ''+req.body.text+'', // plain text body
      html: output // html body
  };
  var today = new Date();
  var messages={
    "fromsender":mailOptions.from,
    "sendername":results[0].Name,
    "emailsender":results[0].sender,
    "status":'sent',
    "Messages":req.body.message,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today
  }
  var messages1={
    "fromsender":mailOptions.from,
    "sendername":results[0].Name,
    "emailsender":results[0].sender,
    "status":'failed',
    "Messages":req.body.message,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today
  }

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        connection.query('INSERT INTO messages SET ?',messages1, function (error, results, fields) {
          console.log(results);
          if (error) {
            console.log("error ocurred",error);
            res.send({
              "code":400,
              "failed":"error ocurred"
            })
          }else{
            console.log("successfully inserted");
            }
          });
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      connection.query('INSERT INTO messages SET ?',messages, function (error, results, fields) {
        console.log(results);
        if (error) {
          console.log("error ocurred",error);
          res.send({
            "code":400,
            "failed":"error ocurred"
          })
        }else{
          console.log("successfully inserted");
          }
        });
        connection.query("select * from messages WHERE status='sent' or status='draft' and emailsender = ?",[results[0].sender],function(err,result,fields){
          if (err) throw err;
          console.log('inside final ');
          console.log(result);
          console.log(result.length);
          result.push(req.body.email);
          result.push(req.body.password);
          result.push(result[0].sendername);
          result.push('All');
          console.log(result);
          res.render('outbox',{result:result});
        });
  });
}); 
}

});
});

app.listen(3000,function(){
    console.log("Server is listening!!!!");
});