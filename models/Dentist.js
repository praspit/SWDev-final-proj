const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt = require('jsonwebtoken');

const DentistSchema=new mongoose.Schema({
  name:{
    type:String,
    required:[true, 'Please add a name']
  },
  email:{
    type:String,
    required:[true, 'Please add a email'],
    unique:true,
    match:[
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      'Please add a valid email' 
    ]
  },
  password:{
    type:String,
    required:[true,'Please add a password'],
    minlength:6,
    select:false,
  },
  yearOfExperience:{
    type: Number,
    required: [true, 'Please add year of experience'],
  },
  areaOfExpertise:{
    type: String,
    required: [true, "Please add area of expertise"]
  },
  resetPasswordToken: String,
  resetPasswordExpired: Date,
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: [true, "Please add dentist's hospital"]
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
});

//Encrypt password using bcrypt
DentistSchema.pre('save', async function(next){
  const salt=await bcrypt.genSalt(10);
  this.password=await bcrypt.hash(this.password,salt);
});

//Sign JWT and return
DentistSchema.methods.getSignedJwtToken=function() {
  return jwt.sign({id:this._id},process.env.JWT_SECRET,{
    expiresIn: process.env.JWT_EXPIRE
  });
}

//Match user entered password to hashed password in database
DentistSchema.methods.matchPassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('Dentist', DentistSchema);