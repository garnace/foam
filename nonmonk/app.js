/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), fs = require('fs'),
cons = require('consolidate'),
  dust = require('dustjs-linkedin'),
  utils = require('./model/utils'),
  recipesModel = require('./routes/recipes');

dust.config.whitespace = true;
var app = express();

app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

var db;

var nano = require('nano')('https://moodyfoodie:moodyfoodie123@moodyfoodie.cloudant.com');

var fileToUpload;

var dbCredentials = {
	dbName : 'recipes'
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

function initDBConnection() {
	// if(process.env.VCAP_SERVICES) {
		// var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		// if(vcapServices.cloudantNoSQLDB) {
			// dbCredentials.host = 'moodyfoodie.cloudant.com';
			// dbCredentials.port = 443;
			// dbCredentials.user = 'moodyfoodie';
			// dbCredentials.password = 'moodyfoodie123';
	
			// // check if DB exists if not create
			// nano.db.create(dbCredentials.dbName, function (err/*, res*/) {
			// 	if (err) { console.log('could not create db ', err); }
		 //    });
			// db = nano.use(dbCredentials.dbName);
		// } else {
		// 	console.log('Could not find nano credentials in VCAP_SERVICES environment variable');
		// }
	// } else{
	// 	console.log('VCAP_SERVICES environment variable not set');
		// For running this app locally you can get your nano credentials 
		// from Bluemix (VCAP_SERVICES in 'cf env' output or the Environment 
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a 
		// Bluemix service.
		//dbCredentials.host = 'REPLACE ME';
		//dbCredentials.port = REPLACE ME;
		//dbCredentials.user = 'REPLACE ME';
		//dbCredentials.password = 'REPLACE ME';
		//dbCredentials.url = 'REPLACE ME';
	// }

	
}

initDBConnection();

app.get('/old', routes.index);
app.use('/api/v1/recipes', recipesModel.getRecipes);
app.get('/', serveFirstPage);
app.get('/randomRecipe', serveRandomRecipe);

function serveFirstPage(req, res) {
	var randomInt = utils.getRandomInt(0, 2);

	var backgroundPath = '/images/backgrounds/';
	if (randomInt === 0) {
		backgroundPath += 'citrus.jpg';
	}
	else if (randomInt === 1) {
		backgroundPath += 'doughnut.jpg';
	}
	else if (randomInt === 2) {
		backgroundPath += 'strawberry.jpg';
	}
	else {
		backgroundPath += 'citrus.jpg';
	}

	res.render('landingPage', {backgroundImage: backgroundPath})
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

function createResponseData(id, name, value, attachments) {

	var responseData = {
		id : id,
		name : name,
		value : value,
		attachements : []
	};
	
	 
	attachments.forEach (function(item, index) {
		var attachmentData = {
			content_type : item.type,
			key : item.key,
			url : 'http://' + dbCredentials.user + ':' + dbCredentials.password
					+ '@' + dbCredentials.host + '/' + dbCredentials.dbName
					+ '/' + id + '/' + item.key
		};
		responseData.attachements.push(attachmentData);
		
	});
	return responseData;
}


var saveDocument = function(id, name, value, response) {
	
	if(id === undefined) {
		// Generated random id
		id = '';
	}
	
	db.insert({
		name : name,
		value : value
	}, id, function(err, doc) {
		if(err) {
			console.log(err);
			response.sendStatus(500);
		} else
			response.sendStatus(200);
		response.end();
	});
	
}

app.post('/api/favorites/attach', multipartMiddleware, function(request, response) {

	console.log('Upload File Invoked..');
	console.log('Request: ' + JSON.stringify(request.headers));
	
	var id;
	
	db.get(request.query.id, function(err, existingdoc) {		
		
		var isExistingDoc = false;
		if (!existingdoc) {
			id = '-1';
		} else {
			id = existingdoc.id;
			isExistingDoc = true;
		}

		var name = request.query.name;
		var value = request.query.value;

		var file = request.files.file;
		var newPath = './public/uploads/' + file.name;		
		
		var insertAttachment = function(file, id, rev, name, value, response) {
			
			fs.readFile(file.path, function(err, data) {
				if (!err) {
				    
					if (file) {
						  
						db.attachment.insert(id, file.name, data, file.type, {rev: rev}, function(err, document) {
							if (!err) {
								console.log('Attachment saved successfully.. ');
	
								db.get(document.id, function(err, doc) {
									console.log('Attachements from server --> ' + JSON.stringify(doc._attachments));
										
									var attachements = [];
									var attachData;
									for(var attachment in doc._attachments) {
										if(attachment == value) {
											attachData = {'key': attachment, 'type': file.type};
										} else {
											attachData = {'key': attachment, 'type': doc._attachments[attachment]['content_type']};
										}
										attachements.push(attachData);
									}
									var responseData = createResponseData(
											id,
											name,
											value,
											attachements);
									console.log('Response after attachment: \n'+JSON.stringify(responseData));
									response.write(JSON.stringify(responseData));
									response.end();
									return;
								});
							} else {
								console.log(err);
							}
						});
					}
				}
			});
		}

		if (!isExistingDoc) {
			existingdoc = {
				name : name,
				value : value,
				create_date : new Date()
			};
			
			// save doc
			db.insert({
				name : name,
				value : value
			}, '', function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					
					existingdoc = doc;
					console.log('New doc created ..');
					console.log(existingdoc);
					insertAttachment(file, existingdoc.id, existingdoc.rev, name, value, response);
					
				}
			});
			
		} else {
			console.log('Adding attachment to existing doc.');
			console.log(existingdoc);
			insertAttachment(file, existingdoc._id, existingdoc._rev, name, value, response);
		}
		
	});

});

app.post('/api/favorites', function(request, response) {

	console.log('Create Invoked..');
	console.log('Name: ' + request.body.name);
	console.log('Value: ' + request.body.value);
	
	// var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	
	saveDocument(null, name, value, response);

});

app.delete('/api/favorites', function(request, response) {

	console.log('Delete Invoked..');
	var id = request.query.id;
	// var rev = request.query.rev; // Rev can be fetched from request. if
	// needed, send the rev from client
	console.log('Removing document of ID: ' + id);
	console.log('Request Query: '+JSON.stringify(request.query));
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			db.destroy(doc._id, doc._rev, function (err, res) {
			     // Handle response
				 if(err) {
					 console.log(err);
					 response.sendStatus(500);
				 } else {
					 response.sendStatus(200);
				 }
			});
		}
	});

});

app.put('/api/favorites', function(request, response) {

	console.log('Update Invoked..');
	
	var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	
	console.log('ID: ' + id);
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			console.log(doc);
			doc.name = name;
			doc.value = value;
			db.insert(doc, doc.id, function(err, doc) {
				if(err) {
					console.log('Error inserting data\n'+err);
					return 500;
				}
				return 200;
			});
		}
	});
});

app.get('/api/favorites', function(request, response) {

	console.log('Get method invoked.. ')
	if (nano) {
		db = nano.use(dbCredentials.dbName);
		var docList = [];
		var i = 0;
		db.list(function(err, body) {
			if (!err) {
				var len = body.rows.length;
				console.log('total # of docs -> '+len);
				if(len == 0) {
					// push sample data
					// save doc
					var docName = 'sample_doc';
					var docDesc = 'A sample Document';
					db.insert({
						name : docName,
						value : 'A sample Document'
					}, '', function(err, doc) {
						if(err) {
							console.log(err);
						} else {
							
							console.log('Document : '+JSON.stringify(doc));
							var responseData = createResponseData(
								doc.id,
								docName,
								docDesc,
								[]);
							docList.push(responseData);
							response.write(JSON.stringify(docList));
							console.log(JSON.stringify(docList));
							console.log('ending response...');
							response.end();
						}
					});
				} else {

					body.rows.forEach(function(document) {
						
						db.get(document.id, { revs_info: true }, function(err, doc) {
							if (!err) {
								if(doc['_attachments']) {
								
									var attachments = [];
									for(var attribute in doc['_attachments']){
									
										if(doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
											attachments.push({'key': attribute, 'type': doc['_attachments'][attribute]['content_type']});
										}
										console.log(attribute+': '+JSON.stringify(doc['_attachments'][attribute]));
									}
									var responseData = createResponseData(
											doc._id,
											doc.name,
											doc.value,
											attachments);
								
								} else {
									var responseData = createResponseData(
											doc._id,
											doc.name,
											doc.value,
											[]);
								}	
							
								docList.push(responseData);
								i++;
								if(i >= len) {
									response.write(JSON.stringify(docList));
									console.log('ending response...');
									response.end();
								}
							} else {
								console.log(err);
							}
						});
						
					});
				}
				
			} else {
				console.log(err);
			}
		});
	}

});


http.createServer(app).listen(app.get('port'), function() {
//	console.log('Express server listening on port '+app.get('env')+process.env.VCAP_SERVICES + app.get('port'));
	console.log('Express server listening on port '+ app.get('port'));
});

