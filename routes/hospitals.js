const express = require('express')
const {getHospitals, getHospital, createHospitals, updateHospital, deleteHospital} = require('../controller/hospitals');
const router = express.Router();

//Include other resource routers
const bookingRouter = require('./bookings');

const {protect,authorize} =require('../middleware/auth');

//Re-route into other resource routers
// router.use('/:hospitalId/bookings/',bookingRouter);
router.route('/').get(getHospitals).post(protect, authorize('admin'), createHospitals);
router.route('/:id').get(getHospital).put(protect, authorize('admin'), updateHospital).delete(protect, authorize('admin'),deleteHospital);

module.exports = router;