
// persistence.store.websql.config(persistence, 'AKHB', 'AKHB db', 10 * 1024 * 1024);

persistence.store.cordovasql.config(
  persistence,
  'myIIUK',
  '1.0',                // DB version
  'myIIUK db',          // DB display name
  5 * 1024 * 1024,        // DB size (WebSQL fallback only)
  0,                      // SQLitePlugin Background processing disabled
  2                       // DB location (iOS only), 0 (default): Documents, 1: Library, 2: Library/LocalDatabase
                          //   0: iTunes + iCloud, 1: NO iTunes + iCloud, 2: NO iTunes + NO iCloud
                          //   More information at https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database
);

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
  	status:"INT",
    is_read:"INT"
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
    icon:"TEXT",
    home_page: "INT"
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
    content_id: "INT",
    status:"INT",
    type:"INT",
    date_time:"DATE",
});

var syncTask = persistence.define('tasks', {
    committe_id: "INT",
    status:"INT",
    last_modified:"DATE",
    inst_type:"INT"
});

// var directory =  persistence.define('directories', {
//     server_id: "INT",
//     type:"INT",
//     title:"TEXT",
//     description:"TEXT",
//     email:"TEXT",
//     members:"JSON",
//     status :"INT",
//     last_modified:"DATE",
//     category_id : "TEXT"
// });
var persons = persistence.define('persons', {
    committees: "TEXT",
    title:"TEXT",
    name:"TEXT",
    home_number:"TEXT",
    mobile:"TEXT",
    email:"TEXT",
});

var committees = persistence.define('committees', {
    server_id:"INT",
    inst_type :"INT",
    category :"TEXT",
    title:"TEXT",
    description :"TEXT",
    email :"TEXT",
    status :"INT",
    last_changed:"DATE",
    last_modified:"DATE",
    is_show:"INT"
});
var committeeContents = persistence.define('committeeContent', {
    server_id:"INT",
    content:"TEXT",
});

//directory.index(['title','category_id']);

