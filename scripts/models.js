
persistence.store.websql.config(persistence, 'AKHB', 'AKHB db', 5 * 1024 * 1024);
//persistence.store.memory.config(persistence);
persistence.debug = false;


var sync = persistence.define('sync', {
	lastUpdatetime: "DATE",
	tableName: "TEXT"
});

var article = persistence.define('articles', {
	server_id:"INT",
  	title: "TEXT",
  	content: "TEXT",
  	last_modified: "DATE",
  	type:"INT",
  	status:"INT"
});

var navigation = persistence.define('navigations', {
	  server_id:"INT",
  	title: "TEXT",
  	last_modified: "DATE",
    content: "TEXT",
  	type:"INT",
  	status:"INT",
  	link: "TEXT",
  	parent_id:"INT",
  	order_by:"INT",
    icon:"TEXT"
});

var message = persistence.define('messages', {
    server_id:"INT",
    title: "TEXT",
    last_modified: "DATE",
    content: "TEXT",
    type:"INT",
    status:"INT",
    read:"INT"
});

var usage = persistence.define('usages', {
    content_id: "TEXT",
    type:"INT",
    date_time:"DATE"
});


persistence.schemaSync(function(tx){
     console.log("Update schema success.");
});
