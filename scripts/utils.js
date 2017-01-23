if (typeof(AKHB) == 'undefined') {
    AKHB = {};
}
if (typeof(AKHB.utils) == 'undefined') {
    AKHB.utils = function() {};
}

AKHB.utils.exitApp = function() {
    if (navigator.app)
        navigator.app.exitApp();
    else
        alert('Exit App');
}

AKHB.utils.format = function(source, params) {
    if (arguments.length == 1)
        return function() {
            var args = $.makeArray(arguments);
            args.unshift(source);
            return $.format.apply(this, args);
        };
    if (arguments.length > 2 && params.constructor != Array) {
        params = $.makeArray(arguments).slice(1);
    }
    if (params.constructor != Array) {
        params = [params];
    }
    $.each(params, function(i, n) {
        source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
    });
    return source;
};
AKHB.utils.daysString = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
AKHB.utils.shortDayString = ['Sun.', 'Mon.', 'Tues.', 'Wed.', 'Thur.', 'Fri.', 'Sat.'];
AKHB.utils.generateSchedules = function(reminder) {

    var arrSchedules = new Array();
    var currentDate = moment().hours(0).minutes(0).seconds(0).toDate();
    if (reminder.type == 1) {
        if (typeof reminder.days == 'string') {
            reminder.jsonDays = JSON.parse(reminder.days);
        }

        if (reminder.end_date && typeof reminder.end_date == "object" && reminder.end_date.getFullYear()) {
            reminder.end_date = moment(reminder.end_date).add('d', 1).toDate();
        } else if (!reminder.end_date) {
            reminder.end_date = moment().add('M', 1).toDate();
        } else {
            reminder.end_date = moment(reminder.start_date).add('M', 1).toDate();
        }
        reminder.start_date = moment(reminder.start_date).toDate();

        while (currentDate <= reminder.end_date) {
            angular.forEach(reminder.jsonDays, function(remindDayIndex, index, arr) {
                var remindDay = moment(currentDate).day(remindDayIndex);
                remindDay = moment(remindDay.format('YYYY-MM-DD ' + reminder.reminder_time));

                if (remindDay.toDate() < currentDate || remindDay.toDate() < reminder.start_date || remindDay.toDate() > reminder.end_date) {

                } else {
                    var schedule = new schedules({
                        trigger_at: remindDay.toDate()
                    });

                    schedule.reminder = reminder;
                    arrSchedules.push(schedule);
                }

                currentDate = remindDay.toDate();
            });
            currentDate = moment(currentDate).day(6).add('d', 1).toDate();
        }
    } else {

        while (currentDate <= reminder.end_date) {
            var diffDay = moment(currentDate).diff(reminder.start_date, 'days');
            var remindDay = moment(currentDate.format('YYYY-MM-DD ' + reminder.reminder_time));
            var mod = diffDay % (reminder.remind_for + reminder.skip_for);
            if (remindDay.toDate() >= new Date()) {
                var schedule = new schedules({
                    trigger_at: remindDay.toDate()
                });
                schedule.reminder = reminder;
                arrSchedules.push(schedule);
            }
            currentDate = moment(currentDate).add('d', 1).toDate();
        }
    }
    //console.log("Schedules:", arrSchedules);
    return arrSchedules;
};
AKHB.utils.getShortDayArray = function(arr) {
    var strArr = new Array();
    angular.forEach(arr, function(item, index) {
        strArr.push(AKHB.utils.shortDayString[item]);
    })
    return strArr;
}

AKHB.utils.getShortDayString = function(arr) {
    return AKHB.utils.getShortDayArray(arr).join(' ');
};
AKHB.utils.addLocalNotification = function(reminder) {
    try {

        var sch = {
            title: "myAKHB",
            text: 'Time to take your medication ' + moment('1900-01-01 ' + reminder.reminder_time).format('hh:mm A'),
            //at: moment('1900-01-01 'reminder.reminder_time).format(),
            //every: "minute",
            // every: "day",
            data: { reminder: reminder }
        };

        if (ons.platform.isIOS) {
            //sch.icon = 'file://icons_akhb/Icon-Small.png';
        } else if (ons.platform.isAndroid) {
            sch.icon = 'file://assets/icons_akhb/Icon-Small.png';
        }
        if (reminder.type == 1) {
            sch.every = 'week';
            var reminderDays = JSON.parse(reminder.days);
            if (reminderDays.length == 7) {
                sch.every = 'day';
                sch.id = reminder.notification_id * 100;
                sch.at = moment(moment(reminder.start_date).format('YYYY-MM-DD') + ' ' + reminder.reminder_time).toDate();
                if (sch.at < new Date()) {
                    sch.at = moment(sch.at).add(1, 'day');
                }
                cordova.plugins.notification.local.schedule(sch);
                console.log("notification added:",sch);
            } else {
                angular.forEach(reminderDays, function(dayIndex) {
                    sch.id = reminder.notification_id * 100 + dayIndex;
                    var firstDate = moment(reminder.start_date).weekday(dayIndex).format('YYYY-MM-DD');
                    sch.at = moment(firstDate + ' ' + reminder.reminder_time).toDate();
                    cordova.plugins.notification.local.schedule(sch);
                    console.log("notification added:",sch);
                });
            }

        } else {
         var totalDay = reminder.remind_for + reminder.skip_for;
         debugger
            for (var i = 0; i < totalDay; i++) {
                sch.id = reminder.notification_id * 100 + i;
                var targetDate = moment(reminder.start_date).add(i, 'day');

                if (targetDate > new Date()) {
                    if (targetDate.diff(moment(), 'days') % totalDay < reminder.remind_for) {
                        sch.at = targetDate.format('YYYY-MM-DD');
                        sch.at = moment(sch.at + ' ' + reminder.reminder_time).toDate();
                        cordova.plugins.notification.local.schedule(sch);
                        console.log("notification added:",sch);
                    }
                }

            }
        }

        cordova.plugins.notification.local.getAllIds(function(ids) {
            console.log("current notifications:", ids);
        });
//        //console.log("add schedule notification:", sch);
//        if (schedule.trigger_at >= new Date()) {
//            cordova.plugins.notification.local.schedule(sch);
//        }

    } catch (ex) {
        console.log(ex);
    }

};

AKHB.utils.clearAllLocalNotification = function(callback) {

    try {
        cordova.plugins.notification.local.cancelAll(function() {
            cordova.plugins.notification.local.clearAll(callback);
        });

    } catch (ex) {
        console.log(ex);
        callback();
    }

};

if (typeof(AKHB.notification) == 'undefined') {
    AKHB.notification = (function() {
        return function() {}
    })();
}

AKHB.notification.confirm = function(message, callback, title) {
    if (navigator.notification && navigator.notification.alert) {
        navigator.notification.confirm(
            message, // message
            callback, // callback
            title ? title : 'Confirm', // title
            ['OK', 'Cancel'] // buttonName
        );
    } else {
        if (confirm(message)) {
            callback(0);
        } else {
            callback(1);
        }
    }
};
AKHB.notification.alert = function(message, callback, title) {
    ons.notification.alert({
        messageHTML: message
    });
    if (typeof callback == 'function') callback();
};
