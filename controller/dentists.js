const Dentist = require('../models/Dentist');

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
//@desc   Register Dentist
//@route  POST /api/v1/auth/register
//@access Public
exports.register=async (req,res,next)=>{
  try{
    //Create dentist
    const dentist=await Dentist.create(req.body);

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
      const response = await Dentist.findByIdAndUpdate(dentist.id, req.body, {
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

//@desc     Get all dentists
//@routes   GET /api/v1/dentists
//@access   Public
exports.getDentists= async (req,res,next)=>{
  try {
      let query;
      const reqQuery = {...req.query};

      const removeFields = ['select','sort','page','limit'];
      removeFields.forEach(param=>delete reqQuery[param]);
      console.log(reqQuery)

      let queryStr = JSON.stringify(reqQuery);
      queryStr = queryStr.replace(/\b(gt|get|lt|lte|in)\b/, match=>`$${match}`);
      query = Dentist.find(JSON.parse(queryStr))

      if(req.query.select){
          const fields = req.query.select.split(',').join(' ');
          query = query.select(fields);
      }

      if(req.query.sort){
          const sortBy = req.query.sort.split(',').join(' ');
          query = query.sort(sortBy);
      } else{
          query=query.sort('-createdAt');
      }

      //Pagination
      const page = parseInt(req.query.page,10) || 1;
      const limit = parseInt(req.query.limit,10) || 25;
      const startIndex = (page-1)*limit;
      const endIndex = page*limit;
      const total = await Dentist.countDocuments();

      query=query.skip(startIndex).limit(limit);

      //Executing query
      const dentists = await query;

      //Pagination result
      const pagination = {};

      if (endIndex<total){
          pagination.next={
              page:page+1,
              limit
          }
      }

      if (startIndex>0){
          pagination.prev={
              page:page-1,
              limit
          }
      }

      res.status(200).json({success:true, count:dentists.length, pagination, data:dentists});
  } catch(err) {
      res.status(400).json({success:false});
  }
}