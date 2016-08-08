// persistence.store.websql.config(persistence, 'AKHB', 'AKHB db', 10 * 1024 * 1024);

// persistence.store.cordovasql.config(
//     persistence,
//     'IIUK',
//     '1.0', // DB version
//     'IIUK db', // DB display name
//     5 * 1024 * 1024, // DB size (WebSQL fallback only)
//     0, // SQLitePlugin Background processing disabled
//     2 // DB location (iOS only), 0 (default): Documents, 1: Library, 2: Library/LocalDatabase
//     //   0: iTunes + iCloud, 1: NO iTunes + iCloud, 2: NO iTunes + NO iCloud
//     //   More information at https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database
// );

if (persistence.store.cordovasql) {
    persistence.store.cordovasql.config(persistence, 'myakhb', '1.0', 'A database description', 50 * 1024 * 1024, 0, 2);
    console.log('use cordovasql');
} else {
    persistence.store.websql.config(persistence, 'myakhb', 'A database description', 5 * 1024 * 1024);
    console.log('use websql');
}
//persistence.store.memory.config(persistence);
persistence.debug = false;


var sync = persistence.define('sync', {
    lastUpdatetime: "DATE",
    tableName: "TEXT"
});

var article = persistence.define('articles', {
    server_id: "INT",
    title: "TEXT",
    content: "TEXT",
    last_modified: "DATE",
    type: "INT",
    status: "INT",
    is_read: "INT"
});

var navigation = persistence.define('navigations', {
    server_id: "INT",
    title: "TEXT",
    last_modified: "DATE",
    content: "TEXT",
    type: "INT",
    status: "INT",
    link: "TEXT",
    parent_id: "INT",
    order_by: "INT",
    icon: "TEXT",
    home_page: "INT"
});

var message = persistence.define('messages', {
    server_id: "INT",
    title: "TEXT",
    last_modified: "DATE",
    content: "TEXT",
    type: "INT",
    status: "INT",
    read: "INT"
});

var usage = persistence.define('usages', {
    content_id: "INT",
    status: "INT",
    type: "INT",
    date_time: "DATE",
});

var syncTask = persistence.define('tasks', {
    committe_id: "TEXT",
    status: "INT",
    last_modified: "DATE",
    inst_type: "INT"
});


var medications = persistence.define('medications', {
    server_id: "TEXT",
    name: "TEXT",
    is_local : "BOOLEAN",
    flag:"INT",
    last_modified: "DATE"
});



var userMedications = persistence.define('userMedications', {
    drug_name: "TEXT",
    directions: "TEXT",
    status:"INT",
    med_id:"TEXT",
    status:"INT",
    server_id:"TEXT",
    last_amend_date: "DATE"
});



var reminders = persistence.define('reminders', {
    server_id:"TEXT",
    days:"TEXT",
    type:"INT",
    skip_for:"INT",
    start_date:"DATE",
    end_date:"DATE",
    remind_for:"INT",
    reminder_time:"TEXT",
    status:"INT",
    last_amend_date: "DATE",
    notification_id:"INT"
});

var schedules = persistence.define('schedules', {
    trigger_at:"DATE",
    triggered:"INT"
});



var committeePersons = persistence.define('committee_persons_link', {
    committe_id: "TEXT",
    person_id: "INT"
});

var persons = persistence.define('persons', {
    committees: "TEXT",
    title: "TEXT",
    name: "TEXT",
    home_number: "TEXT",
    mobile: "TEXT",
    email: "TEXT",
    server_id: "INT",
    last_modified: "DATE",
});

var committees = persistence.define('committees', {
    server_id: "TEXT",
    inst_type: "INT",
    category: "TEXT",
    title: "TEXT",
    description: "TEXT",
    email: "TEXT",
    status: "INT",
    last_changed: "DATE",
    last_modified: "DATE",
    is_show: "INT"
});
var committeeContents = persistence.define('committeeContent', {
    server_id: "TEXT",
    content: "TEXT",
});

var tableRowIndex = persistence.define('tableRowIndex', {
    tableName: "TEXT",
    index: "INT",
});

//directory.index(['title','category_id']);

medications.index(['name']);

userMedications.hasOne('ServerMedication',medications);
medications.hasMany('userMedications',userMedications,'medications');

userMedications.hasMany('reminders',reminders,'userMedications');
reminders.hasMany('userMedications',userMedications,'reminders');

reminders.hasMany('schedules',schedules,'reminder');
schedules.hasOne('reminder',reminders);
