var express = require('express'),
    models = require('../models'),
    Sequelize = require('Sequelize'),
    debug = require('debug')('ppt:api'),
    router = express.Router();

const FINDALL_OPTION_WHITELIST = [
  'limit', 'offset', 'having', 'include', 'where', 'attributes'
];

router.get('/findAll/:modelName', function(req, res) {
  var model = models[req.params.modelName],
      options = {},
      rawOptions;

  try {
    rawOptions = (req.query.q && JSON.parse(req.query.q)) || {}
  } catch (e) {
    debug('findAll q option parsing failed', e, e.stack);
    res.status(422).send("" + e).end();
    return;
  }

  FINDALL_OPTION_WHITELIST.forEach(key => {
    if(typeof rawOptions[key] !== 'undefined'){
      options[key] = rawOptions[key];
    }
  });

  if ( model ) {
    if(options.include){
      options.include = parseIncludes(model, options.include);
    }

    model.findAll(options).then( data => {
      res.json(data);
    }).catch( reason => {
      debug('Model fetch rejected', reason);
      res.status(422).end();
    } );
  } else {
    res.status(500).end();
  }
});

// Parses "options.include" for /findAll.
// Note that "model", "as" and "through" options are omitted deliberately,
// because all relations should be already declared by schema, so "association"
// should be the only valid option.
//
const INCLUDE_KEYS_WHITELIST = [
  'association', 'where', 'attributes', 'required'
];

function parseIncludes(sourceModel, includes) {
  return includes.map( includeOpt => {

    // If includeOpt is already an Sequelize.Model instance,
    // no need for parsing this item.
    if (includeOpt instanceof Sequelize.Model) {
      return includeOpt;
    }

    var opt = {}, model;

    INCLUDE_KEYS_WHITELIST.forEach( key => {
      if( typeof includeOpt[key] !== 'undefined' ) {
        opt[key] = includeOpt[key];
      }
    });

    if(typeof opt.association === 'string') {
      opt.association = sourceModel.associations[includeOpt.association];
      model = opt.association.target;
    }

    // Parse nested include
    if (includeOpt.include) {
      if(model){
        opt.include = parseIncludes(model, includeOpt.include);
      }else{
        throw "options.include[] should include 'association'.";
      }
    }

    return opt;
  });
}

module.exports = router;
