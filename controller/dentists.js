const Dentist = require('../models/Dentist');

//@desc   Register Dentist
//@route  POST /api/v1/auth/register
//@access Public
exports.register=async (req,res,next)=>{
  try{
    const {name, email, password, role}=req.body;
    //Create dentist
    const dentist=await Dentist.create({
      name,
      email,
      password,
      role,
    });

    //Create token
    // const token=dentist.getSignedJwtToken();

    // res.status(200).json({success:true,token});
    sendTokenResponse(dentist,200,res);
  } catch(err){
    res.status(400).json({success:false});
    console.log(err.stack);
  }
}

//@desc   Login Dentist
//@route  POST /api/v1/auth/login
//@access Public
exports.login=async (req,res,next)=>{
  try{
    const {email, password}=req.body;
  
    //Validate email & password
    if(!email || !password){
      return res.status(400).json({success:false,msg:'Please provide an email and password'});
    }
    
    //Check for dentist
    const dentist=await Dentist.findOne({email}).select('+password');
  
    if(!dentist){
      return res.status(400).json({success:false,msg:'Invalid credentials'});
    }
  
    //Check if password matches
    const isMatch = await dentist.matchPassword(password);
  
    if(!isMatch){
      return res.status(401).json({success:false,msg:'Invalid credentials'});
    }
  
    //Create token
    // const token=dentist.getSignedJwtToken();
  
    // res.status(200).json({success:true,token});
    const sendTokenResponse=(dentist,statusCode,res)=>{
      //Create token
      const token=dentist.getSignedJwtToken();
    
      const options ={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true
      };
    
      if(process.env.NODE_ENV==='production'){
        options.secure=true;
      }
      res.status(statusCode).cookie('token',token,options).json({
        success:true,
        //add for frontend
        _id:dentist._id,
        name: dentist.name,
        email:dentist.email,
        //end for frontend
        token
      })
    }
    sendTokenResponse(dentist,200,res);
  } catch(err){
    return res.status(401).json({success:false, msg:'Cannot convert email or password to string'});
  }
}

//@desc   Get current Logged in Dentist
//@route  POST /api/v1/auth/me
//@access Private
exports.getMe=async(req,res,next)=>{
  const dentist=await Dentist.findById(req.dentist.id);
  res.status(200).json({
    success:true,
    data:dentist
  })
}

//@desc   Log dentist out / clear cookie
//@route  GET /api/v1/auth/logout
//@access Private
exports.logout=async(req,res,next)=>{
  res.cookie('token','none',{
    expires: new Date(Date.now() + 10*1000),
    httpOnly:true
  });

  res.status(200).json({
    success:true,
    data:{}
  })
}


//@desc     Update single dentist
//@routes   PUT /api/v1/dentist/:id
//@access   Private
exports.updateDentist= async (req,res,next)=>{
  try {
      const dentist = await this.getMe().data
      if(req.params.id && dentist.id !== req.params.id){
        return res.status(400).json({success:false, msg:"Not authorize to access this route"});
      }
      const response = await Dentist.findByIdAndUpdate(req.params.id, req.body, {
          new:true,
          runValidators: true
      });

      if(!response)
          return res.status(400).json({success:false});

      res.status(200).json({success:true, data:response});
  } catch(err) {
      res.status(400).json({success:false});
  }
}
