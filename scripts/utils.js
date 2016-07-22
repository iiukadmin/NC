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
AKHB.utils.daysString = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
AKHB.utils.shortDayString = ['Mon.', 'Tues.', 'Wed.', 'Thur.', 'Fri.', 'Sat.', 'Sun.'];
AKHB.utils.generateSchedules = function(reminder) {

    var arrSchedules = new Array();
    var currentDate = moment().hours(0).minutes(0).seconds(0).toDate();
    if (reminder.type == 1) {
        if (typeof reminder.days == 'string') {
            reminder.jsonDays = JSON.parse(reminder.days);
        }

        reminder.end_date = moment(reminder.end_date).add('d', 1).toDate();
        reminder.start_date = moment(reminder.start_date).toDate();

        while (currentDate <= reminder.end_date) {
            angular.forEach(reminder.jsonDays, function(remindDayIndex, index, arr) {
                var remindDay = moment(currentDate).day(remindDayIndex);
                remindDay = moment(remindDay.format('YYYY-MM-DD ' + reminder.reminder_time));

                if (remindDay.toDate() < new Date() || remindDay.toDate() < reminder.start_date || remindDay.toDate() > reminder.end_date) {

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
    console.log("Schedules:", arrSchedules);
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
AKHB.utils.addLocalNotification = function(schedule) {

    try {
        schedule.fetch('reminder', function(reminder) {
            var sch = {
                id: schedule.reminder.notification_id,
                title: "myAKHB",
                text: 'Time to take your medication ' + moment('1900-01-01 ' + schedule.reminder.reminder_time).format('hh:mm A'),
                at: schedule.trigger_at,
                //every: "minute",
                // every: "day",
                data: { schedule: schedule }
            };
            console.log("add schedule notification:", sch);
            cordova.plugins.notification.local.schedule(sch);
        })
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
