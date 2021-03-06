//require("coffee-script")
//require("coffee-script/register")
//require("./server")

var express=require('express');
var mongo = require('mongodb');
var routes= require('./routes');
var user= require('./routes/user');
var monk = require('monk');
var MongoClient = require('mongodb').MongoClient;
var assert  = require('assert');
var formidable = require('formidable');
var busboy = require("connect-busboy");
var db;
 db = monk('localhost:27017/test');
var http=require('http');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

//var monUrl='mongodb://localhost:27017/things';
//var monUrl='mongodb://localhost:27017/things';
var monUrl='mongodb://localhost:27017/test';
var path = require('path'), fs = require('fs'),
cons = require('consolidate'),
  dust = require('dustjs-linkedin'),
  utils = require('./model/utils'),
  recipesModel = require('./routes/recipes');

dust.config.whitespace = true;
var app = express();

app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');


// all environments
// app.set('port', 7777);
 app.set('port', 3000);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended:true}));
//app.use(bodyParser.urlencoded({extended:false}));

//--------------bodyParser (body-parser for formidable or express.bodyParser)
app.use(bodyParser.json());
//app.use(express.bodyParser());

app.use(methodOverride());
app.use(express.static(path.join(__dirname,'public')));
app.use('/style',express.static(path.join(__dirname,'/views/style')));
//app.use(connect.multipart());
//app.use(multipart());
//app.use(multipartMiddleware());


// ----mongoDB--cwbuecheler.com*********

// // Do all your "pre-route" use() functions first
// app.use(function (req, res, next) {
 //   req.locals.db = db;
 // this is setting up db property to request
  //  next();
   //    });

 //app.get('/users', routes.userlist);

//app.use('/', routes);
//app.use('/users', users);

/// catch 404 and forwarding to error handler
/***

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});



app.use(function(err,req,res){
	res.status(err.status || 500);
	res.render('error',{
		message: err.message,
		error:{};
	})

});


***/

// ----/.mongoDB--cwbuecheler.com *********




//--above 
/*
MongoClient.connect(monUrl,function(err,database){
	if (err) throw err;

	db = database;
http.createServer(app).listen(app.get('port'), function() {
		console.log('Express db server listening on port '+ app.get('port'));
		});
});
*/
/* put above
http.createServer(app).listen(app.get('port'), function() {
		console.log('Express db server listening on port '+ app.get('port'));
		});
*/
	//app.listen(port);
	//console.log("listening to port");
app.use(function(req,res,next){
	req.db=db;
	next();

});
//app.locals.db = db;
app.use(busboy());



app.get('/api/v1/recipes', recipesModel.getRecipes);
app.get('/api/v1/recipesAll', recipesModel.getAllRecipes);
app.get('/', serveFirstPage);
//app.post('/upload',multipartMiddleware,uploadFile);
app.post('/upload',uploadFilebus);
//app.post('/upload',uploadFile);
//app.post('/upload',upStub);
//app.post('/upload',upFile);
app.get('/randomRecipe', serveRandomRecipe);
/*app.get('/listdb',function(req,res){

	db.driver.admin.listDatabases(function(e,dbs){

	res.json(dbs);});

});
*/
app.get('/drop',function(req,res){

	req.db.get('recipes').drop(function(e,docs){
		if (e){
			res.send('error dropping recipes table');
		}

	});
});
//app.get('/fav/:name',function(req,res){
app.get('/fav',function(req,res){

//	var collection= req.db.get('things');
//	var collection= db.get('things');
//	var collection= db.get('stage');
	//var collection= db.collection('things');
//--recip	var collection= req.db.get('things');
	var collection= req.db.get('recipes');

	collection.insert({
		name:'pumpkin latte',
		mood:'lazy'
	},function(e,docs){
		if (e){
			res.send("error inserting/creating recipes");
		}

	});
	//var collection= req.db.collection('things');
	//var collection= req.db.collection(req.params.name);
	//collection.find({},{}, function(e,docs){
	

	//res.render('landingPage',{"stage":docs});

/*
	if (collection === null)
	{
		collection.insert({name:'pumpkin latte',mood:'lazy'},function(e,docs){
			if (e) return next(e);
//			res.json(docs);
		});

	}
*/


	collection.find({},{},function(e,docs){
		res.json(docs);
	});
	/*collection.find({},{}).toArray( function(e,docs){
	if (e) return next(e);
	res.send(docs);
	});*/
}
);

app.get('/mInitDB', function(req,res){
	var collection=req.db.get('recipes');
	var er = '';
	collection.insert({
		name:req.query.name,

		ingredients:req.params.ingredients,
		mood:req.query.moods,
		imageUrl:req.query.imageUrl


	},function(e,docs){

		if (e) 
		{
			er = 'initialization error inserting ';
		}
	});

});

//app.get('/mfavourites',function(req,res){
app.post('/mfavourites',function(req,res){
	var collection= req.db.get('recipes');
	var er = 'ok';
	collection.insert(
/*{
		tags:req.body.tags,
		steps:req.body.steps
		tags: req.query.tags,
		moods:req.query.moods,
		time:req.query.time,
		expertise:req.query.expertise,
		ingredients:req.query.ingredients,

		steps:req.query.steps,
		name:req.query.name,
		imageUrl:req.query.imageUrl
}


{		steps:req.body.steps,
		name:req.body.name,
		imageUrl:req.query.imageUrl
}
*/
	req.body,function(e,docs){
		if (e){
			er =  "error inserting/creating recipes" ;
//			res.send("error inserting/creating recipes");
		}

	});
	//var collection= req.db.collection('things');
	//var collection= req.db.collection(req.params.name);
	//collection.find({},{}, function(e,docs){
	

	//res.render('landingPage',{"stage":docs});

/*
	if (collection === null)
	{
		collection.insert({name:'pumpkin latte',mood:'lazy'},function(e,docs){
			if (e) return next(e);
//			res.json(docs);
		});

	}
*/


	collection.find({},{},function(e,docs){
		if (e)
		{
			res.send(er);
		}
		else{

		res.json(docs);
		}
	});
	

});
//app.get('/fav/:name',function(req,res){



app.get('/fav/:name',function(req,res){

//	var collection= req.db.get('things');
//	var collection= db.get('things');
//	var collection= db.get('stage');
	//var collection= db.collection('things');
//--recip	var collection= req.db.get('things');
	var collection= req.db.get('recipes');

	collection.insert({
		name:'pumpkin latte',
//		mood:req.params('name')
		mood:req.params.name
	},function(e,docs){
		if (e){
			res.send("error inserting/creating recipes");
		}

	});
	//var collection= req.db.collection('things');
	//var collection= req.db.collection(req.params.name);
	//collection.find({},{}, function(e,docs){
	

	//res.render('landingPage',{"stage":docs});

/*
	if (collection === null)
	{
		collection.insert({name:'pumpkin latte',mood:'lazy'},function(e,docs){
			if (e) return next(e);
//			res.json(docs);
		});

	}
*/


	collection.find({},{},function(e,docs){
		res.json(docs);
	});
	/*collection.find({},{}).toArray( function(e,docs){
	if (e) return next(e);
	res.send(docs);
	});*/
}
);



app.get('/favOne',function(req,res){

//	var collection= req.db.get('things');
//	var collection= db.get('things');
//	var collection= db.get('stage');
	//var collection= db.collection('things');
	var collection= req.db.get('things');
	//var collection= req.db.collection('things');
	//var collection= req.db.collection(req.params.name);
	//collection.find({},{}, function(e,docs){
	
	//res.render('landingPage',{"stage":docs});

	if (req.query.stage === null)
	{
	collection.find({stage:'test'},{},function(e,docs){
		if (e) return next(e);
		res.json(docs);
	});
	}else{
		collection.find({stage:req.query.stage},{},function(e,docs){
			if (e) return next(e);
			res.json(docs);	
		});
	}
	/*collection.find({},{}).toArray( function(e,docs){
	if (e) return next(e);
	res.send(docs);
	});*/
}
);

app.get('/favPar',function(req,res){

//	var collection= req.db.get('things');
//	var collection= db.get('things');
//	var collection= db.get('stage');
	//var collection= db.collection('things');
	var collection= req.db.get('things');
	//var collection= req.db.collection('things');
	//var collection= req.db.collection(req.params.name);
	//collection.find({},{}, function(e,docs){
	
	//res.render('landingPage',{"stage":docs});

	if (req.query.stage === null)
	{
	collection.find({stage:'test'},{},function(e,docs){
		if (e) return next(e);
		res.json(docs);
	});
	}else{
		collection.find({stage:req.query.stage},{},function(e,docs){
			if (e) return next(e);
			res.json(docs);	
		});
	}
	/*collection.find({},{}).toArray( function(e,docs){
	if (e) return next(e);
	res.send(docs);
	});*/
}
);


/*****
https://tonyspiro.com/uploading-and-resizing-an-image-using-node-js/

*****/
function upFile(req,res){

	fs.readFile(req.files.image.path,function(err,data){

		var fileName = req.files.image.name;

		if (!fileName)
		{
			console.log("file request error");
			res.redirect("/");
			res.end();
		}else
		{
			var newPath= __dirname+ "/uploads/" + fileName;
			
			fs.writeFile(newPath,data,function(err)  {

				//display image
				res.redirect("/uploads/" + fileName);

			});
		}


	});
	

}

function upFOld(req,res)
{

	var form = new formidable.IncomingForm();

	req.socket.setTimeout(10*60*1000);


	form.parse(req, function(error,fields,files){
//var tmpName = 
//	fileName=req.files.image.name;

	     var fileName=files.image.name;
	     //var newPath = __dirname+ "/uploadss"+fileName;
	     var newPath = __dirname+ "/uploads"+fileName;


//	     fs.rename(files.upload.path,'./tmp.jpg',function (err){
	     fs.rename(files.upload.path,newPath,function (err){
		if (err)
			res.send("error uploading"+files.upload.path);
		else
			res.send('wrote to file path'+files.upload.path);
	     });//fs rename file
		console.log(req.body,req.files);

	});//parse form

}


function uploadFile(req,res){
	
	var form = new formidable.IncomingForm();
	
//	var form = new multipartMiddleware.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

//	req.socket.setTimeout(10*60*1000);

//	form.parse(req,function(err,fields,files){
//	form.parse(req).on('file',function(name,file){
	form.uploadDir="/tmp";
	form.on('file',function(name,file){
//		var imageName = files.image.name;
//		var imageNameb = req.files.image.name;
		
//		var imageName = files.upload.path;
		var imageName = name;
//		var imageName = req.body.image.name;
//		var imageName=null;

//formllllt		form.on("part",function(part){

//		imageName=part.filename;
//		imageName=part.filename;

//	      fs.readFile(files.upload.path,function(err,data){
//	      fs.readFile(req.body.image.path,function(err,data){
//	      fs.readFile(part.filename,function(err,data){

		if (!imageName)
		{
			console.log("file request error");
			console.log(name);
			console.log(file);
			res.redirect("/");
			res.end();
		}		
		else
		{
			res.send('wrote to file path');
//			console.log(fields);
			console.log(file);
		}

/*		else
		{

			var newPath= __dirname + "/uploads/" + imageName;
			

			fs.writeFile(newPath,data,function(err){

				res.redirect("/uploads/"+ imageName);
			});
		}
*/

//formult		});

//	      });

	});
//----


//---
}


function uploadFilebus(req,res){
/*
stackoverflow --File uploading with express 4.0
--use busboy
*/	


//	var form = new formidable.IncomingForm();
	
//	var form = new multipartMiddleware.Form({maxFieldSize: 8192, maxFields: 10, autoFiles: false});

//	req.socket.setTimeout(10*60*1000);

//	form.parse(req,function(err,fields,files){
//	form.parse(req).on('file',function(name,file){

	var fstream;

	req.pipe(req.busboy);

//	form.uploadDir="/tmp";
//	form.on('file',function(name,file){
	req.busboy.on('file',function (fieldname,file,filename){

//		var imageName = files.image.name;
//		var imageNameb = req.files.image.name;
		
//		var imageName = files.upload.path;
//		var imageName = name;
		var imageName = filename;
		var fstream;
//		var imageName = req.body.image.name;
//		var imageName=null;

//formllllt		form.on("part",function(part){

//		imageName=part.filename;
//		imageName=part.filename;

//	      fs.readFile(files.upload.path,function(err,data){
//	      fs.readFile(req.body.image.path,function(err,data){
//	      fs.readFile(part.filename,function(err,data){

		if (!imageName)
		{
			console.log("file request error");
			console.log(name);
			console.log(file);


			res.redirect("/");
			res.end();
		}		
		else
		{


//		fstream= fs.createWriteStream(__dirname + '/files/' +filename);
		fstream= fs.createWriteStream('/tmp/' +filename);
		file.pipe(fstream);
		fstream.on('close',function(){
			res.redirect('/');
		});


			res.send('wrote to file path::'+filename);
//			console.log(fields);
			console.log(file);
		}


/*		else
		{

			var newPath= __dirname + "/uploads/" + imageName;
			

			fs.writeFile(newPath,data,function(err){

				res.redirect("/uploads/"+ imageName);
			});
		}
*/

//formult		});

//	      });

	});
//----


//---
}




function upStub (req,res){

	var form = new formidable.IncomingForm();

	req.socket.setTimeout(10*60*1000);


	fs.readFile(req.files.image.path,function(err,data){

		var fileName = req.files.image.name;

		if (!fileName)
		{
			console.log("file request error");
			res.redirect("/");
			res.end();
		}else
		{
			var newPath= __dirname+ "/uploads/" + fileName;
			
			fs.writeFile(newPath,data,function(err)  {

				//display image
				res.redirect("/uploads/" + fileName);

			});
		}


	});


}

function serveFirstPage(req, res) {
	var randomInt=utils.getRandomInt(0,2);

	var backgroundPath = '/images/backgrounds/';
	if (randomInt === 1)
	{
		backgroundPath += 'citrus.jpg';
	}
	else
	{

		backgroundPath += 'strawberry.jpg';
	}
//	var backgroundPath = '/images/backgrounds/';
//jj		backgroundPath += 'citrus.jpg';

//	res.render('landingPage',{backgroundImage:backgroundPath},{stage:"textstage"});
	res.render('landingPage',{backgroundImage:backgroundPath,stage:"text text text"});
}

function serveRandomRecipe(req, res) {
	var moods=['unspecified','adventurous','lazy','stressed'];
//	var mood = req.query.mood;
	var mood = moods[parseInt(req.query.mood)].toString();

//	var mood = req.query.mood;
	var time = req.query.time;
	var expertise = req.query.expertise;

	if (!mood) {
		return res.status(400).send('Query Param Mood must be defined');
	}

	if (!time) {
		return res.status(400).send('Query Param Time must be defined');
	}

	if (!expertise) {
		return res.status(400).send('Query Param Expertise must be defined');
	}

	var timeInt = parseInt(time);
	var expertiseInt = parseInt(expertise);
	var recipe = recipesModel.getRandomRecipe(mood, timeInt, expertiseInt);
	console.log(JSON.stringify(recipe, null, 2));
	var backgroundPath = '/images/backgrounds/recipe_page05background.png';

	res.render('randomRecipe', {recipe: recipe, backgroundImage: backgroundPath});
}



app.get('*',function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});



app.use(function(err,req,res,next){
	res.status(err.status || 500);
	res.send(err.message);
/*	res.render('error',{
		message: err.message,
		error:{};
	});
*/
});


http.createServer(app).listen(app.get('port'), function() {
		console.log('Express server listening on port '+ app.get('port'));
		});
