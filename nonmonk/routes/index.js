
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('old_index.html', { title: 'Cloudant Boiler Plate' });
};