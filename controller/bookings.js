const Booking = require('../models/Booking');
const Hospital = require('../models/Hospital');
const Dentist = require('../models/Dentist');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Public
exports.getBookings = async (req, res, next) => {
    let query;
    // General users can see only their Bookings!
    if (req.user.role === 'user') {
        console.log('user')
        query = await Booking.find({user: req.user.id})
    } else { // If you are an admin, you can see all Bookings!
        query = await Booking.find();
    }

    try {
        const bookings = await Promise.all(query.map(async (booking) => {
            console.log(booking)
            if(booking.prefDentist){
                await booking.populate({
                    path: 'prefDentist',
                    select: 'name yearOfExperience areaOfExpertise'
                })
            }
            if(booking.prefHospital){
                await booking.populate({
                    path: 'prefHospital',
                    select: 'name province telephone'
                })
            }
            return booking
        }));

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Cannot find Bookings"});
    }
}

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Public
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'prefHospital',
            select: 'name province tel'
        }).populate({
            path: 'prefDentist',
            select: 'name yearOfExperience areaOfExpertise'
        })
        if (!booking) {
            return res.status(404).json({success: false, message: `No Booking with the id of ${req.params.id}}`});
        }
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Cannot find Bookings"});
    }   
}

// @desc    Add booking
// @route   POST /api/v1/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
    try {
        if ( typeof req.body.prefHospital === 'undefined' && typeof req.body.prefDentist === 'undefined'){
            return res.status(400).json({success: false, message: "User doesn't specify any preferred dentist or preferred hospital"});
        }

        if ( typeof req.body.prefHospital !== 'undefined' ){      
            const hospital = await Hospital.findById(req.body.prefHospital);
            if (!hospital) {
                return res.status(404).json({success: false, message: `No hospital with the id of ${req.body.prefHospital}`});
            }
        }

        if ( typeof req.body.prefDentist !== 'undefined' ){      
            const dentist = await Dentist.findById(req.body.prefDentist);
            if (!dentist) {
                return res.status(404).json({success: false, message: `No Dentist with the id of ${req.body.prefDentist}`});
            }
        }

        // Add user Id to req.body
        req.body.user = req.user.id;

        // Check for existed Booking
        const existedBookings = await Booking.find({user: req.user.id});

        // If the user is not an admin, he can only make 1 Bookings!
        if (existedBookings.length >= 1 && req.user.role !== 'admin') {
            return res.status(400).json({success: false, message: `The user with ID ${req.user.id} has already made a Bookings!`});
        }

        const booking = await Booking.create(req.body);
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Cannot create Booking"});
    }
}

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({success: false, message: `No Booking with the id of ${req.params.id}`});
        }

        // Make sure user is booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this Booking`});
        }

        if ( typeof req.body.prefHospital === 'undefined' && typeof req.body.prefHospital === 'undefined'){
            return res.status(400).json({success: false, message: "User doesn't specify any preferred dentist or preferred hospital"});
        }

        if ( typeof req.body.prefHospital !== 'undefined' ){      
            const hospital = await Hospital.findById(req.body.prefHospital);
            if (!hospital) {
                return res.status(404).json({success: false, message: `No hospital with the id of ${req.body.prefHospital}`});
            }
        }

        if ( typeof req.body.prefDentist !== 'undefined' ){      
            const dentist = await Dentist.findById(req.body.prefDentist);
            if (!dentist) {
                return res.status(404).json({success: false, message: `No Dentist with the id of ${req.body.prefDentist}`});
            }
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Cannot update Booking"});
    }
}

// @desc    Delete booking
// @route   DELETE /api/v1/booking/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({success: false, message: `No Booking with the id of ${req.params.id}`});
        }

        // Make sure user is booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to delete this Booking`});
        }

        await booking.remove();
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Cannot delete Booking"});
    }
}