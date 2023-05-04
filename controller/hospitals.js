const Hospital = require('../models/Hospital')
// const vacCenter = require('../models/VacCenter')
//@desc     Get all hospitals
//@routes   GET /api/v1/hospitals
//@access   Public
exports.getHospitals= async (req,res,next)=>{
    try {
        let query;
        const reqQuery = {...req.query};

        const removeFields = ['select','sort','page','limit'];
        removeFields.forEach(param=>delete reqQuery[param]);
        console.log(reqQuery)

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|get|lt|lte|in)\b/, match=>`$${match}`);
        query = Hospital.find(JSON.parse(queryStr))

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
        const total = await Hospital.countDocuments();

        query=query.skip(startIndex).limit(limit);

        //Executing query
        const hospitals = await query;

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

        res.status(200).json({success:true, count:hospitals.length, pagination, data:hospitals});
    } catch(err) {
        res.status(400).json({success:false});
    }
}

//@desc     Get single hospitals
//@routes   GET /api/v1/hospitals/:id
//@access   Public
exports.getHospital=async (req,res,next)=>{
    try {
        const hospital = await Hospital.findById(req.params.id);

        if(!hospital)
            return res.status(400).json({success:false});

        res.status(200).json({success:true, data:hospital});
    } catch(err) {
        res.status(400).json({success:false});
    }
}

//@desc     Create all hospitals
//@routes   POST /api/v1/hospitals
//@access   Private
exports.createHospitals= async (req,res,next)=>{
    const hospital = await Hospital.create(req.body);
    res.status(201).json({success:true, data:hospital});
}

//@desc     Update single hospitals
//@routes   PUT /api/v1/hospitals/:id
//@access   Private
exports.updateHospital= async (req,res,next)=>{
    try {
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new:true,
            runValidators: true
        });

        if(!hospital)
            return res.status(400).json({success:false});

        res.status(200).json({success:true, data:hospital});
    } catch(err) {
        res.status(400).json({success:false});
    }
}

//@desc     Delete single hospitals
//@routes   DELETE /api/v1/hospitals/:id
//@access   Private
exports.deleteHospital= async (req,res,next)=>{
    try {
        const hospital = await Hospital.findById(req.params.id);

        if(!hospital){
            return res.status(400).json({success:false});
        }
        hospital.remove();

        res.status(200).json({success:true, data:{}});
    } catch(err) {
        res.status(400).json({success:false});
    }
}