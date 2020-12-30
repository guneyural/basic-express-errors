const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Joi = require('joi');
const morgan = require('morgan');
const { ErrorHandler } = require('./errorHandler');

mongoose.connect('mongodb://localhost:27017/testBase1', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:true})
.then(()=>console.log('Connected to database'))
.catch((err)=>{
	throw new ErrorHandler(500, 'Could Not Connect To Database');
});

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(morgan('dev'));

const asyncErr = (fn) => {
	return function(req,res,next) {
		fn(req,res,next).catch((err)=>next(err))
	}
}

const userValidation = Joi.object({
	username: Joi.string().required(),
	password: Joi.string().required(),
	age: Joi.number().required().min(13)
});

const userSchema = new mongoose.Schema({
	username:{
		type: String,
		required: true
	},
	password:{
		type: String,
		required: true
	},
	age: {
		type: Number,
		required:true
	}
});
const User = mongoose.model('User', userSchema);

app.get('/', (req, res)=>{
	res.send('Güney Ural');
});

app.post('/user', asyncErr(async(req,res,next)=>{
	const {error} = userValidation.validate(req.body);
	const errMessages = error.details.map(item=>item.message).join(', ');
	if(error) throw new ErrorHandler(400, errMessages);
	const newUser = new User(req.body);
	await newUser.save();
	res.send(newUser)
}));

app.get('/user/:id', asyncErr(async(req,res)=>{
	const getUser = await User.findById(req.params.id);
	if(!getUser) throw new ErrorHandler(404, 'User Not Found');
	res.json(getUser);
}));

app.all('*', (req, res)=>{
	throw new ErrorHandler(404, 'Page Not Found.');
});

app.use((err,req,res,next)=>{
	let {message, statusCode} = err;
	if(!message) message = 'Something Went Wrong!';
	res.json({
		message,
		statusCode
	})
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Is Running On Port ${PORT}`));