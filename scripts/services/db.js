if(typeof(AKHB) == 'undefined'){
	AKHB = {};
}
if(typeof(AKHB.services) == 'undefined'){
	AKHB.services = {};
}

AKHB.services.db =(function(){
	return function(){
		persistence.schemaSync();
	}
})();

AKHB.services.db.prototype.getTableLastUpdateTime = function(tableName,callback){
	var mSync = sync.all().filter('tableName','=',tableName);
	mSync.one(null,function(result){
		callback(false,result);
	});
};

AKHB.services.db.prototype.setTableLastUpdateTime = function(tx,tableName,lastUpdatetime,callback){
	this.getTableLastUpdateTime(tableName,function(err,result){
		if(!result){
			var _sync = new sync({
				tableName:tableName,
				lastUpdatetime:lastUpdatetime
			});
			persistence.add(_sync);
		}else{
			result.lastUpdatetime = lastUpdatetime;
		}
		if(!tx){
			persistence.flush(function() {
			  callback(false);
			});
		}else{
			callback(false);
		}
		
	});
};


AKHB.services.db.prototype.getArticleById = function(id,callback){
	var mArticles = article.all().filter('server_id','=',id);
	mArticles.one(null,function(article){
		callback(false,article);
	})
};

AKHB.services.db.prototype.getHomeArticle = function(callback){
	var mArticles = article.all().filter('type','=','3');
	mArticles.list(null,function(articles){
		var count = articles.length;
		if(count == 0){
			callback(false,null);
		}
		else if(count == 1){
			callback(false,articles[0]);
		}else{
			var index = Math.floor(Math.random()*count);
			callback(false,articles[index]);
		}
		
	})
};

AKHB.services.db.prototype.setArticle = function(tx,_article,callback){
	this.getArticleById(_article.id,function(err,resultArticle){
		if(!resultArticle){
			var _mArticle = new article({
				server_id:_article.id,
			  	title: _article.title,
			  	content: _article.content.replace(/\\\"/ig, "\""),
			  	last_modified: moment(_article.last_modified).toDate(),//_article.last_modified,
			  	type:_article.type,
			  	status:_article.status
			});
			persistence.add(_mArticle);
		}else{
			if(_article.status == 1){
				persistence.remove(resultArticle);
			}else{
				resultArticle.title= _article.title;
				resultArticle.content= _article.content.replace(/\\\"/ig, "\"");
				resultArticle.last_modified= moment(_article.last_modified).toDate();
				resultArticle.type= _article.type;
				resultArticle.status= _article.status;
			}
		}
		if(!tx){
			persistence.flush(function() {
			  callback(false);
			});
		}else{
			callback(false);
		};
	});
};


AKHB.services.db.prototype.getMessageById = function(id,callback){
	var mMessages = message.all().filter('server_id','=',id);
	mMessages.one(null,function(_message){
		callback(false,_message);
	})
};

AKHB.services.db.prototype.setMessage = function(tx,_message,callback){
	console.log(_message);
	this.getMessageById(_message.id,function(err,resultMessage){
		if(!resultMessage){
			var _mMessage = new message({
				server_id:_message.id,
			  	title: _message.title,
			  	content: _message.content.replace(/\\\"/ig, "\""),
			  	last_modified: moment(_message.last_modified).toDate(),
			  	type:_message.type,
			  	status:_message.status
			});
			persistence.add(_mMessage);
		}else{
			if(_message.status == 1){
				persistence.remove(resultMessage);
			}else{
				resultMessage.title= _message.title;
				resultMessage.content= _message.content.replace(/\\\"/ig, "\"");
				resultMessage.last_modified= moment(_message.last_modified).toDate();
				//console.log("_message",_message.last_modified,_message);
				resultMessage.type= _message.type;
				resultMessage.status= _message.status;
			}
		}
		if(!tx){
			persistence.flush(function() {
			  callback(false);
			});
		}else{
			callback(false);
		};
	});
};


AKHB.services.db.prototype.getNavigationById = function(id,callback){
	var mNavigations = navigation.all().filter('server_id','=',id);
	mNavigations.one(null,function(navigation){
		callback(false,navigation);
	})
};
AKHB.services.db.prototype.hasNavigationChildren = function(id,callback){
	var mNavigations = navigation.all().filter('parent_id','=',id);
	mNavigations.and(new persistence.PropertyFilter('status','=','0'))
	.one(null,function(navigation){
		callback(false,navigation);
	})
};
AKHB.services.db.prototype.setNavigation = function(tx,_navigation,callback){
	this.getNavigationById(_navigation.id,function(err,resultNavigation){
		if(!resultNavigation){
			var _mNavigation = new navigation({
				server_id:_navigation.id,
			  	title: _navigation.title,
			  	parent_id: _navigation.parent_id,
			  	order_by: _navigation.order_by,
			  	content: _navigation.content,
			  	link: _navigation.link,
			  	last_modified:  moment(_navigation.last_modified).toDate(),//_navigation.last_modified,
			  	type:_navigation.type,
			  	status:_navigation.status,
			  	icon:_navigation.icon
			});
			persistence.add(_mNavigation);
		}else{
			if(_navigation.status == 1){
				persistence.remove(resultNavigation);
			}else{
				resultNavigation.title = _navigation.title;
				//resultNnavigation.content(_navigation.content);
				resultNavigation.last_modified = moment(_navigation.last_modified).toDate();
				resultNavigation.type = _navigation.type;
				resultNavigation.status = _navigation.status;
				resultNavigation.content = _navigation.content;
				resultNavigation.parent_id = _navigation.parent_id;
				resultNavigation.link = _navigation.link;
				resultNavigation.order_by = _navigation.order_by;
				resultNavigation.icon = _navigation.icon;
			}
		}
		if(!tx){
			persistence.flush(function() {
			  callback(false);
			});
		}else{
			callback(false);
		}
	});
};

AKHB.services.db.prototype.getNavigationsByParentId = function(id,callback){
	var mNavigations = navigation.all();
	mNavigations.filter('parent_id','=',id)
	.and(new persistence.PropertyFilter('status','=','0'))
	.order('order_by',true)
	.order('last_modified',false)
	.list(null,function(messages){
		callback(false,messages);
	});
};

AKHB.services.db.prototype.getMessages = function(callback){
	var mMessages = message.all();
	mMessages.filter('status','=','0')
	.order('type',true)
	.order('server_id',false)
	.list(null,function(messages){
		callback(false,messages);
	});
};
AKHB.services.db.prototype.getMessageCount = function(callback){
	var mMessages = message.all();
	mMessages.filter('read','=','0')
	.count(null,function(count){
		callback(false,count);
	});
};
AKHB.services.db.prototype.getActiveMessageCount = function(callback){
	var mMessages = message.all();
	mMessages.filter('type','=','2')
	.and(new persistence.PropertyFilter('read','=','0'))
	.count(null,function(count){
		callback(false,count);
	});
};

AKHB.services.db.prototype.getLatestActiveMessage = function(callback){
	var mMessages = message.all()
	.filter('type','=','2')
	.and(new persistence.PropertyFilter('read','=','0'))
	.order('server_id',false);
	mMessages.one(null,function(message){
		callback(false,message);
	})
};
AKHB.services.db.prototype.setMessageUsed = function(id,callback){

	var mMessages = message.all().filter('server_id','=',id);
	mMessages.one(null,function(message){
		message.type = 2;
		persistence.flush(function() {
		 	callback(false,message);
		});
	})
};
AKHB.services.db.prototype.setUsage = function(id,type,callback){
	var _usage = new usage({
		type:type,
		content_id:id,
		date_time:new Date()
	});
	persistence.add(_usage);
	persistence.flush();
};
AKHB.services.db.prototype.getUsage = function(type,callback){
	var usages = usage.all().filter('type','=',type).limit(30);
	usages.list(function(data){
		callback(null,data);
	})
};

AKHB.services.db.prototype.getNavigations = function(callback){
	var mNavigations = navigation.all();
	mNavigations.filter('status','=','0')
		.order('parent_id',false)
		.order('order_by',true)
		.list(null,function(navigations){

		var jsonNavigations = new Array();
		async.each(navigations,function(nav,cb){
			nav.selectJSON(null,['*'],function(jsonResult){
				jsonNavigations.push(jsonResult);
				cb(null);
			})
		},function(err){
			var getNavigationsByParentId = function(parentId){
				var mNavArray = new Array();
				for(var nav in jsonNavigations){
					if(parentId == jsonNavigations[nav].parent_id){
						mNavArray.push(jsonNavigations[nav])
					}
				}
				return mNavArray;
			}
			if(typeof callback == 'function') {
				for(var nav in jsonNavigations){
					var childNavs = getNavigationsByParentId(jsonNavigations[nav].server_id);
					if(childNavs.length > 0){
						jsonNavigations[nav].children = childNavs;
					}
				}
				var newJsonNavigations = new Array();
				for(var nav in jsonNavigations){
					if(jsonNavigations[nav].parent_id == 0){
						newJsonNavigations.push(jsonNavigations[nav]);
					}
				}
				callback(null,newJsonNavigations);
			}

		});
		
	});
};

AKHB.services.db.prototype.clear =function(callback){
	persistence.reset(null, function(){
		persistence.schemaSync(function(){
			if(typeof callback == 'function') callback();
		});
	});
};