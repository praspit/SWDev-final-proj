const express = require('express');
const {register, login, getMe, logout,updateDentist, getDentists} = require('../controller/dentists');

const router = express.Router();

const {protect} = require('../middleware/dentists');

router.post('/register',register);
router.post('/login',login);
router.get('/me',protect,getMe);
router.get('/logout',logout);
router.put('/',protect,updateDentist);
router.get('/',getDentists);

module.exports=router;