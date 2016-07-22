//ons.disableAutoStatusBarFill();  // (Monaca enables StatusBar plugin by  
var MSG_RETUIREDNETWORK = { title: 'Internet Connection', content: 'Sorry, a network connection is required, please try later.' };
var MSG_LOGINFAILED = { title: 'Incorrect Password', content: 'Please check password and try again.' };
var MSG_SYSTEMERROR = { title: 'System Error', content: 'Please check you have a network connection. If issues persist, please contact <a href="mailto:enquiries@iiuk.org">enquiries@iiuk.org</a>. <br /> Error Code:100' };

var pushNotification;
var module = ons.bootstrap('AKHB', ['onsen', 'ngTouch']);
var Auth = new AKHB.services.authentication(AKHB.config);
var DBSync = null;
window.DB = null;

AKHB.user = { id: null, authcode: null, appVersion: '1.0' };
AKHB.xhr = [];
$.ajaxSetup({
    beforeSend: function(xhr) {
        AKHB.xhr.push(xhr);
    },
    complete: function(xhr) {
        var tmp = [];
        for (var _index in AKHB.xhr) {
            if (AKHB.xhr[_index].readyState == 4) {
                AKHB.xhr.pop(AKHB.xhr[_index]);
            }
        }
    }
});

try {
    document.addEventListener('deviceready', function() {
        // cordova.plugins.notification.local is now available
        cordova.plugins.notification.local.hasPermission(function(granted) {
            console.log("hasPermission", granted);
            // console.log('Permission has been granted: ' + granted);
            if (granted) return;
            cordova.plugins.notification.local.registerPermission(function(granted) {
                // console.log('Permission has been granted: ' + granted);
                console.log("registerPermission", granted);
            });
        });

        cordova.plugins.notification.local.on("click", function(notification) {
            if (typeof myNavigator == undefined) {
                window.isFromLocalNotification = true;
            } else {
                myNavigator.pushPage('pages/schedules.html');
            }
        });
        cordova.plugins.notification.local.on("trigger", function(notification) {
            console.log("trigger notification:", notification);
            var data = JSON.parse(notification.data);
            var schedule = data.schedule;
            schedules.load(schedule.id, function(data) {
                data.triggered = 1;
                setTimeout(function() {
                    schedules.all()
                        .filter("reminder_id", "=", schedule.reminder_id)
                        .and(new persistence.PropertyFilter('id', '!=', schedule.id))
                        .and(new persistence.PropertyFilter('triggered', '=', 0))
                        .order("trigger_at", true)
                        .one(function(scheduleNext) {
                            AKHB.utils.addLocalNotification(scheduleNext);
                            console.log("register next notification:", scheduleNext);
                        });
                }, 500);

            })

        });

    }, false)


} catch (ex) {
    console.log(ex);
}

AKHB.openContentPage = function(navigation, $templateCache) {
    if (navigation.type == 1) {

    } else if (!isNaN(navigation.content)) {
        DB.getArticleById(navigation.content, function(err, article) {
            if (article.type == 4) { // External Browser Link
                if (!Auth.isNetworkConnected()) {
                    AKHB.notification.alert('Sorry, a network connection is required, please try later.', null, 'Internet Connection', 'Try Later');
                } else {
                    window.open(article.content, '_system');
                }
            } else if (article.type == 5) { // Internal Browser
                if (!Auth.isNetworkConnected()) {
                    AKHB.notification.alert('Sorry, a network connection is required, please try later.', null, 'Internet Connection', 'Try Later');
                } else {
                    ref = window.open(article.content, '_blank', 'location=no,hidden=yes,toolbar=yes,enableViewportScale=yes,toolbarposition=top');
                    $('div.loading').removeClass('ng-hide');
                    ref.addEventListener('loadstop', function() {
                        ref.show();
                        $('div.loading').addClass('ng-hide');
                    });
                }
            } else { // Pure content or an iFrame view of a web page (1,2)
                if (article.type == 2 && !Auth.isNetworkConnected()) {
                    AKHB.notification.alert('Sorry, a network connection is required, please try later.', null, 'Internet Connection', 'Try Later');
                } else {
                    $templateCache.put('article', article);
                    myNavigator.pushPage('pages/content.html', { article: article });
                }
            }
        });
    }
}


module.controller('AppController', ['$scope', '$rootScope', '$templateCache', function($scope, $rootScope, $templateCache) {

    $rootScope.$on("BUSY", function() {
        $scope.busy = true;
        $scope.waitNetwork = false;
        console.log('emit BUSY', $scope.busy, $scope.$id);
    });
    $rootScope.$on("NOTBUSY", function() {
        $scope.busy = false;
        $scope.waitNetwork = false;
        console.log('emit NOTBUSY', $scope.busy, $scope.$id);
    });
    $rootScope.$on("WAITINGNETWORK", function() {
        $scope.busy = true;
        $scope.waitNetwork = true;
        console.log('emit WAITINGNETWORK', $scope.busy, $scope.$id);
    });

    $rootScope.openIndividual = function(individual, isindividual) {
        $rootScope.$emit("BUSY");
        if (isindividual) {
            $templateCache.put('individual', individual);
            myNavigator.pushPage('pages/directoryindividual.html');
        } else {
            DB.getCommitteById(individual.id, function(err, data) {
                if (!err && data) {
                    var directory = data;
                    DB.getCommitteContentById(directory.server_id, function(err, data) {
                        if (data) directory.content = JSON.parse(data.content);
                        $templateCache.put('directory', directory);
                        myNavigator.pushPage('pages/directorydetail.html');
                    })
                } else {
                    $templateCache.put('individual', individual);
                    myNavigator.pushPage('pages/directoryindividual.html');
                }
            })
        }

    };
    $rootScope.signOut = function() {
        var Auth = new AKHB.services.authentication(AKHB.config);
        Auth.cleanAuthentication(function() {
            for (var timer in AKHB.services.timer) {
                clearTimeout(AKHB.services.timer[timer]);
                delete AKHB.services.timer[timer];
            }
            for (var _index in AKHB.xhr) {
                if (AKHB.xhr[_index].readyState != 4) {
                    AKHB.xhr[_index].abort();
                }
            }
            localStorage.removeItem('isFirstVisit');
            AKHB.config.firstRun = true;
            app.slidingMenu.setSwipeable(false);
            app.slidingMenu.closeMenu();
            app.slidingMenu.setMainPage('pages/login_' + window.AKHB.config.application + '.html');
        });
    }
    document.addEventListener('deviceready', function() {


        if (!window.plugins || !window.plugins.pushNotification) return;
        try {

            var pushNotification = window.plugins.pushNotification;

            //regist notification
            if (device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos") {
                pushNotification.register(
                    successHandler,
                    errorHandler, {
                        "senderID": window.AKHB.config.senderID,
                        "ecb": "onNotificationGCM"
                    });
            } else if (device.platform == 'blackberry10') {
                // pushNotification.register(
                // successHandler,
                // errorHandler,
                // {
                //     invokeTargetId : "replace_with_invoke_target_id",
                //     appId: "replace_with_app_id",
                //     ppgUrl:"replace_with_ppg_url", //remove for BES pushes
                //     ecb: "pushNotificationHandler",
                //     simChangeCallback: replace_with_simChange_callback,
                //     pushTransportReadyCallback: replace_with_pushTransportReady_callback,
                //     launchApplicationOnPush: true
                // });
            } else {
                pushNotification.register(
                    tokenHandler,
                    errorHandler, {
                        "badge": "true",
                        "sound": "true",
                        "alert": "true",
                        "ecb": "onNotificationAPN"
                    });
            }

        } catch (ex) {
            console.log("Notification error:", ex);
        }

    }, false);
    // Added to update iOS bade with unread message count.
    document.addEventListener("pause", function() {
        updateBadge($rootScope.messageCount);
    }, false);
}]);

module.controller('SlidingMenuController', ['$scope', function($scope) {
    $scope.$on("isready", function(event, data) {
        $scope.isready = data;
    });
}]);
module.controller('LandingPageController', ['$scope', '$rootScope', '$sce', '$templateCache', function($scope, $rootScope, $sce, $templateCache) {
    var scope = $scope;
    var rootScope = $rootScope; // Added to allow access to messageCount

    $scope.openPage = function(nav) {
        $templateCache.put('navigation', nav);
        if (nav.type == 2) {
            AKHB.openContentPage(nav, $templateCache);
        } else if (nav.type == 3) {
            app.slidingMenu.setMainPage('pages/messagelistpage.html', { closeMenu: true })
        } else if (nav.type == 5) {
            app.slidingMenu.setMainPage('pages/directoryindex.html', { closeMenu: true })
		} else if (nav.type == 6) {
                myNavigator.pushPage('pages/medication.html');
            }
else if (nav.type == 4) {
            $scope.signOut();
        } else {
            myNavigator.pushPage('pages/childmenu.html');
        }

    }

    $scope.signOut = $rootScope.signOut;
    DB.getHomeArticle(function(err, result) {
        DB.getHomepageIcons(function(err, navigations) {
            DB.getUnreadMessageCount(function(err, count) {
                scope.$apply(function() {
                    if (!result.is_read) {
                        result.is_read = 1;
                        DB.setUsage(result.server_id, 1, 1, 0);
                    }
                    scope.messageCount = count;
                    $rootScope.messageCount = count; // Added to allow access to messageCount
                    scope.hasMessage = count > 0;
                    scope.navigations = navigations;
                    scope.title = $sce.trustAsHtml(result.title);
                    scope.article = $sce.trustAsHtml(result.content);
                });
            });
        })
    });

    if (window.isFromLocalNotification) {
        setTimeout(function() {
            myNavigator.pushPage('pages/schedules.html');
        }, 1000);
    }

}]);

module.controller('MessageListController', ['$scope', '$rootScope', '$templateCache', function($scope, $rootScope, $templateCache) {
    var scope = $scope;
    scope.nav = $templateCache.get('navigation');
    scope.messages = [];
    scope.menuClick = function() {
        app.slidingMenu.toggleMenu();
    };
    scope.openMessageDetail = function(msg, $event) {
//        if ($event.type != "touchend") return;
        $templateCache.put('message', msg);
        myNavigator.pushPage('pages/messagedetail.html');
    };
    var loadMessage = function() {
        DB.getMessages(function(err, messages) {
            scope.$apply(function() {
                scope.messages = messages;
            });
        })
    }

	$scope.isEmpty = function (obj) {
		for (var i in obj) if (obj.hasOwnProperty(i)) return false;
		return true;
	};


    if (Auth.isNetworkConnected()) {
        DBSync.runMessageSync(loadMessage, true);
    } else {
        loadMessage();
    }

    $scope.$on("Refresh", function() {
        loadMessage();
        console.log('emit Refresh');
    });
    $scope.deleteMessage = function(msg, $event) {
        $event.stopPropagation();
        ons.notification.confirm({
            message: 'Are you sure you want to delete?',
            callback: function(answer) {
                if (answer) {
                    DB.deleteMessage(msg.server_id, function() {
                        DB.setUsage(msg.server_id, 2, 2);
                        $rootScope.$broadcast("Refresh");

                        if (Auth.isNetworkConnected()) {
                            DBSync.runMessageSync();
                        }
                    });
                }
            }
        });

    };
}]);
module.controller('MessageDetailController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        var scope = $scope;
        var message = $templateCache.get('message');
        $scope.message = message;

        if (message.status != 1) {
            DB.setUsage(message.server_id, 2, 1, 0);
            console.log(message.server_id, 2, 1, 0);
        }

        message.status = 1;
        persistence.flush();

        $scope.deleteMessage = function() {
            ons.notification.confirm({
                message: 'Are you sure you want to delete?',
                callback: function(answer) {
                    if (answer) {
                        DB.deleteMessage(message.server_id, function() {
                            DB.setUsage(message.server_id, 2, 2);
                            $rootScope.$broadcast("Refresh");
                            if (Auth.isNetworkConnected()) {
                                DBSync.runMessageSync();
                            }
                            myNavigator.popPage();
                        });
                    }
                }
            });
        }

        // if(message.type == 1){
        //     DB.setMessageUsed(message.server_id,function(err,result){
        //         console.log(err,result);
        //     });
        // }
    }
]);


module.controller('LoginController', ['$scope', '$http', '$templateCache', '$rootScope',
    function($scope, $http, $templateCache, $rootScope) {

        app.slidingMenu.setSwipeable(false);
        var scope = $scope;
        var rootScope = $rootScope;

        scope.isready = true;

        ons.ready(function() {
            if (typeof device == 'undefined') {
                AKHB.user.deviceid = '00000000000000031';
                AKHB.user.os = 'ios';
                AKHB.user.deviceName = 'browser test';
            } else {
                AKHB.user.deviceid = device.uuid;
                AKHB.user.os = device.version;
                AKHB.user.deviceName = device.model;
                if (typeof getAppVersion == 'function') {
                    getAppVersion(function(version) {
                        AKHB.user.appVersion = version;
                        console.log('Native App Version: ' + version);
                    });
                }
            };
            scope.isready = true;

            setTimeout(function() {
                DBSync = new AKHB.services.db.DBSync(AKHB.config, $http);
                initLogin();
                //alert('asdf');
            }, 1);
        });

        function initLogin() {
            var runMessageSync = function() {
                if (Auth.isNetworkConnected()) {
                    DBSync.runMessageSync(runMessageSync);
                } else {
                    setTimeout(runMessageSync, 30000);
                }
            }
            var onlineLogin = function() {
                Auth.isWebserviceWorking($http, function(err, result) {
                    rootScope.$emit("NOTBUSY");
                    if (err) {
                        AKHB.notification.alert(result.content, function() {
                            AKHB.utils.exitApp();
                        }, result.title);
                    } else {
                        scope.login = function() {
                            var password = scope.password;
                            var userName = scope.username;
                            var authData = Auth.AuthenticationRequest(AKHB.user.deviceid, userName, password);
                            rootScope.$emit("BUSY");
                            Auth.checkRemoteAuthentication($http, authData, function(err, result) {

                                if (err) {
                                    AKHB.notification.alert(result.content, null, result.title);
                                    rootScope.$emit("NOTBUSY");
                                } else {

                                    DBSync.runInBackGround(function(err) {
                                        rootScope.$emit("NOTBUSY");
                                        $rootScope.$broadcast("MenuReady");
                                        app.slidingMenu.setSwipeable(true);
                                        app.slidingMenu.setMainPage('pages/landingpage_' + window.AKHB.config.application + '.html');
                                        setTimeout(syncBackGround, window.AKHB.config.timeout);
                                    }, true);
                                    runMessageSync();
                                }

                            });
                        }

                    }
                });
            }
            try {
                //rootScope.$emit("BUSY"); 
                // check network and server.
                var syncTimes = 0;
                var syncBackGround = function() {
                    syncTimes++;
                    if (Auth.isNetworkConnected()) {
                        DBSync.runInBackGround(function() {
                            console.log('sync times:' + syncTimes);
                            syncBackGround();
                        });
                    } else {
                        console.log('sync times:' + syncTimes);
                        syncBackGround();
                    }
                }
                if (Auth.isCachedAuthentication()) {
                    $rootScope.$emit("NOTBUSY");
                    app.slidingMenu.setSwipeable(true);
                    app.slidingMenu.setMainPage('pages/landingpage_' + window.AKHB.config.application + '.html');
                    var user = JSON.parse(Auth.getCachedAuthentication());
                    AKHB.user = user;
                    DBSync.runInBackGround(function(err) {
                        //$rootScope.$emit("BUSY");
                        syncBackGround();
                    }, true);
                    runMessageSync();

                } else {
                    //Auth.checkNetworkConnected();
                    onlineLogin();
                }
            } catch (ex) {
                console.log(ex);
                rootScope.$emit("WAITINGNETWORK");
                if (ex.message == 'nonetwork')
                    AKHB.notification.alert(MSG_RETUIREDNETWORK.content, function() {
                        //AKHB.utils.exitApp();
                    }, MSG_RETUIREDNETWORK.title);
                document.addEventListener("online", function() {
                    rootScope.$emit("NOTBUSY");
                    initLogin();
                }, false);
            }
        }

    }
]);


module.controller('MenuController', ['$scope', '$rootScope', '$http', '$templateCache',
    function($scope, $rootScope, $http, $templateCache) {
        $scope.openPage = function(nav) {
            $templateCache.put('navigation', nav);
            if (nav.type == 2) {
                AKHB.openContentPage(nav, $templateCache);
            } else if (nav.type == 3) {
                app.slidingMenu.setMainPage('pages/messagelistpage.html', { closeMenu: true })
            } else if (nav.type == 5) {
                app.slidingMenu.setMainPage('pages/directoryindex.html', { closeMenu: true })
            } else if (nav.type == 4) {
                $scope.signOut();
            } else if (nav.type == 6) {
                myNavigator.pushPage('pages/medication.html');
            } else if (nav.type == 7) {
                myNavigator.pushPage('pages/survey.html');
            } else {
                myNavigator.pushPage('pages/childmenu.html');
            }

        }

        $scope.signOut = $rootScope.signOut;
        $scope.navigations = [];
        var loadMenu = function(scope) {
            DB.getNavigationsByParentId(0, function(err, navigations) {
                scope.$apply(function() {
                    scope.navigations = navigations;
                });
            });
        }
        $rootScope.$on("MenuReady", function() {
            loadMenu($scope);
            console.log('emit MenuReady');
        });

        app.slidingMenu.on('preopen', function() {
            loadMenu($scope);
        });

        //  $scope.toggle = function(obj){
        //      console.log(obj);
        //      $templateCache.put('navigation',obj);
        //      myNavigator.pushPage('pages/childmenu.html');
        // }

    }
]);



module.controller('ChildMenuController', ['$scope', '$http', '$templateCache', '$sce',
    function($scope, $http, $templateCache, $sce) {
        $scope.navigation = $templateCache.get('navigation');
        $scope.openPage = function(nav) {
            $templateCache.put('navigation', nav);
            app.slidingMenu.setSwipeable(true);
            if (nav.type == 2) {
                AKHB.openContentPage(nav, $templateCache);
            } else {

                myNavigator.pushPage('pages/childmenu.html');
            }
        }

        //$scope.contentHTML = $sce.trustAsHtml(article.content);
        DB.getNavigationsByParentId($scope.navigation.server_id, function(err, results) {
            async.each(results, function(nav, callback) {
                if (nav.type == 1) {
                    DB.getNavigationsByParentId(nav.server_id, function(err, navigations) {
                        nav.children = navigations;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }, function(err, result) {
                $scope.$apply(function() {
                    $scope.childNavigations = results;
                });
            });

        });
    }
]);


module.controller('ContentController', ['$scope', '$http', '$templateCache', '$sce', '$rootScope',
    function($scope, $http, $templateCache, $sce, $rootScope) {
        var Auth = new AKHB.services.authentication(AKHB.config);

        var article = $templateCache.get('article');

        window.rootScope = $rootScope;
        if (article == null) return;
        $scope.article = article;
        $scope.nav = $templateCache.get('navigation');

        if (!article.is_read) {
            article.is_read = 1;
            DB.setUsage(article.server_id, 1, 1, 0);
        }
        if (article.type == 2) {
            if (!Auth.isNetworkConnected()) {
                $scope.contentHTML = $sce.trustAsHtml("<p class=empty-content>" + MSG_RETUIREDNETWORK.content + "</p>");
            } else {
                if (article.content.toLowerCase().indexOf('http') == -1)
                    article.content = 'http://' + article.content;

                if (article.content.indexOf('?') > -1)
                    article.content += '&';
                else
                    article.content += '?';

                article.content += 'uuid=' + AKHB.user.id;

                //用插件打開
                //------------------------------------------------------------------------
                // var ref = window.open(article.content,'_blank','location=yes');
                // //exit
                // ref.addEventListener('exit', function() { 
                //     myNavigator.popPage();
                // });
                //------------------------------------------------------------------------

                $('div.loading').removeClass('ng-hide');
                $scope.contentHTML = $sce.trustAsHtml('<iframe name="contentFrame" id="content-iframe" src="' + article.content + '" ng-if="article.type==2" onload="$(\'div.loading\').addClass(\'ng-hide\');"></iframe>');
                //                $scope.contentHTML = $sce.trustAsHtml('<iframe name="contentFrame" id="content-iframe" src="'+article.content +'" ng-if="article.type==2"></iframe>');
                //                $('div.loading').removeClass('ng-hide');
                //                setTimeout(function(){
                // $rootScope.$emit("BUSY");
                //                    $('div.loading').addClass('ng-hide');
                //                },5000);

                // console.log($('#content-iframe'));
                // setTimeout(function(){
                //     var iframe =  $('#content-iframe')[0];
                //     
                //     console.log(iframe.readyState);
                //    iframe.addEventListener("readystatechange",function(){
                //     
                //         console.log(iframe.readyState);
                //         $rootScope.$emit("NOTBUSY");
                //     });
                // },500);

            }
        } else {

            $scope.contentHTML = $sce.trustAsHtml(article.content);

        }
        DB.getMessageCount(function(err, count) {
            $scope.$apply(function() {
                $scope.hasMessage = count > 0;
            });
        });

    }
]);

module.controller('DirectoryController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {

        $scope.nav = $templateCache.get('navigation');

        $scope.OpenDirectoryPage = function($event, type) {
            var dict = {
                title: $($event.target).text(),
                type: type.id
            };
            $templateCache.put('dict', dict);
            myNavigator.pushPage('pages/directorylist.html');
        }
        $scope.categories = JSON.parse(localStorage.getItem("category")).items;

        var timer = null;
        var sec = 500;
        $scope.loaddata = false;
        $scope.directories = [];
        $scope.persons = [];
        $scope.emptySearch = true;
        $scope.noCommitteesData = false;
        $scope.noPersonsData = false;

        $scope.OpenDirectoryDetail = function(directory) {
            $rootScope.$emit("BUSY");
            DB.getCommitteContentById(directory.server_id, function(err, data) {
                if (data) directory.content = JSON.parse(data.content);
                $templateCache.put('directory', directory);
                myNavigator.pushPage('pages/directorydetail.html');
            })

        };

        $scope.openIndividual = function(individual) {
            $rootScope.openIndividual(individual, true);
        };
        $scope.clearInput = function() {

            $scope.key = '';
            $scope.emptySearch = true;
            $scope.loaddata = false;
            $scope.noCommitteesData = true;
            $scope.noPersonsData = true;
            $scope.directories = [];
            $scope.persons = [];
        }

        var search = function() {
            $scope.$apply(function() {
                $scope.noCommitteesData = false;
                $scope.noPersonsData = false;
            })
            if (timer) {
                clearTimeout(timer);
                if ($.trim($scope.key) == '') {
                    $scope.$apply(function() {
                        $scope.emptySearch = true;
                        $scope.loaddata = false;
                        $scope.noCommitteesData = false;
                        $scope.noPersonsData = false;
                    })
                    return;
                }

            }

            timer = setTimeout(function() {
                var data = {};
                $scope.key = $.trim($scope.key.replace(/\s+/g, ' '));
                async.series([
                    function(callback) {
                        //console.log("searchCommittees");
                        DB.searchCommittees($scope.key, function(err, committees) {
                            data.committees = committees;
                            //console.log("Committees",err,committees);
                            callback(err);
                        });
                    },
                    function(callback) {
                        //console.log("searchPersons");
                        DB.searchPersons($scope.key, function(err, persons) {
                            data.persons = persons;
                            //console.log("Persons",err,persons);
                            callback(err);
                        });
                    }
                ], function(err) {
                    if (!err) {
                        $scope.$apply(function() {
                            $scope.noCommitteesData = data.committees.length == 0;
                            $scope.noPersonsData = data.persons.length == 0;
                            $scope.loaddata = false;
                            $scope.directories = data.committees;
                            $scope.persons = data.persons;
                        });
                    }
                });

            }, sec);
        };
        $scope.triggerSearch = function() {
            $scope.loaddata = true;
            $scope.emptySearch = false;
            $scope.directories = [];
            timer = setTimeout(search, sec);
        };

    }
]);
module.controller('DirectoryListController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        $scope.dict = $templateCache.get('dict');
        $scope.dict.count = 50;
        $rootScope.$emit("BUSY");
        var busy = true;
        // DB.getDirectoriesCount($scope.dict.type,function(err,data){
        //     $scope.$apply(function(){
        //         $scope.dict.count = data;
        //         $('ons-list').css('height',45*$scope.dict.count);
        //         $scope.MyDelegate.countItems = function() {
        //             return $scope.dict.count;
        //         }
        //     })

        // });
        $scope.OpenDirectoryDetail = function(directory) {
            $rootScope.$emit("BUSY");
            DB.getCommitteContentById(directory.server_id, function(err, data) {
                if (data) directory.content = data.content;
                $templateCache.put('directory', directory);
                myNavigator.pushPage('pages/directorydetail.html');
            })

        };
        $scope.dicts = [];
        $scope.loadCompleted = false;
        $scope.pageIndex = 1;
        $scope.pageSize = 20;
        $scope.myScroll = null;
        $scope.isLoading = true;
        $scope.myScrollOptions = {
            probeType: 3,
            mouseWheel: true
        };
        $scope.myScroll = new IScroll('#wrapper', { probeType: 2, mouseWheel: true });
        $scope.getDirectoryDataCallback = function(err, data) {
            $scope.isLoading = false;
            $scope.$apply(function() {
                if (data.length < $scope.pageSize) {
                    $scope.loadCompleted = true;
                }
                if (busy) {
                    busy = false;
                    $rootScope.$emit("NOTBUSY");
                }
                $scope.dicts = $scope.dicts.concat(data);
                $scope.pageIndex++;

                setTimeout(function() {
                    $scope.myScroll.refresh();
                }, 500);

            });
        }

        $scope.myScroll.on('scrollEnd', function() {
            if ($scope.loadCompleted || $scope.isLoading) return;
            if (Math.abs(this.maxScrollY - this.y) < 40) {
                $scope.isLoading = true;
                DB.getDirectoriesPagnation($scope.dict.type, $scope.pageIndex, $scope.pageSize, $scope.getDirectoryDataCallback);
            }
        });

        DB.getDirectoriesPagnation($scope.dict.type, $scope.pageIndex, $scope.pageSize, $scope.getDirectoryDataCallback);



        // $scope.MyDelegate  = {
        //   configureItemScope: function(index, itemScope) {

        //     if(!itemScope.item){
        //         itemScope.item = {};
        //         DB.getDirectoriesPagnation($scope.dict.type,index,function(err,data){
        //             $scope.$apply(function(){
        //                 if(busy) {
        //                     busy = false;

        //                     $rootScope.$emit("NOTBUSY");
        //                 } 
        //                 itemScope.item = data[0];
        //             })
        //         });
        //     }
        //     //itemScope.item = $scope.dict.items[index];
        //   },
        //   calculateItemHeight: function(index) {
        //     return 45;
        //   },
        //   countItems: function() {
        //     return 5;
        //   },
        //   destroyItemScope: null
        // };
    }
]);

module.controller('DirectoryDetailController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        $scope.directory = $templateCache.get('directory');
        $rootScope.$emit("NOTBUSY");
        // if(typeof $scope.directory.members == "undefined")
        //     $scope.directory.members = JSON.parse($scope.directory.content);
        try {
            if (typeof $scope.directory.content == "object") {
                $scope.directory.members = $scope.directory.content;
            } else if (typeof $scope.directory.content == "string") {
                $scope.directory.members = JSON.parse($scope.directory.content);
            }
        } catch (ex) {

        }

        if (!$scope.directory.content) {
            $scope.isSync = true;
        }
        $scope.openIndividual = function(individual) {
            $rootScope.openIndividual(individual, true);
        };
    }
]);
module.controller('DirectoryIndividualController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        $rootScope.$emit("NOTBUSY");
        $scope.individual = $templateCache.get('individual');
        if (!$scope.individual.name) {
            $scope.individual.name = $scope.individual.forename + ' ' + $scope.individual.Surname;
        }
        if ($scope.individual.committees && typeof $scope.individual.committees == 'string') {
            $scope.individual.committees_json = JSON.parse($scope.individual.committees);
        } else if (typeof $scope.individual.committees == 'object') {
            $scope.individual.committees_json = $scope.individual.committees;
        }
        $scope.openIndividual = function(individual) {
            $rootScope.openIndividual(individual);
        };
    }
]);
module.controller('DirectoryDescriptionController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        $scope.directory = $templateCache.get('directory');
    }
]);
module.controller('DirectorySearchController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        var timer = null;
        var sec = 500;
        $scope.loaddata = false;
        $scope.directories = [];

        $scope.OpenDirectoryDetail = function(directory) {
            DB.getCommitteContentById(directory.server_id, function(err, data) {
                if (data) directory.content = JSON.parse(data.content);
                $templateCache.put('directory', directory);
                myNavigator.pushPage('pages/directorydetail.html');
            })

        };

        var search = function() {
            if (timer) {
                clearTimeout(timer);
                if ($.trim($scope.key) == '') {
                    $scope.loaddata = false;
                    return;
                }
            }

            timer = setTimeout(function() {

                DB.searchDirectories($scope.key, function(err, data) {
                    if (!err) {
                        $scope.$apply(function() {
                            $scope.loaddata = false;
                            $scope.directories = data;
                        });
                    }
                });
            }, sec);
        };

        $scope.clearInput = function() {
            $scope.key = '';
            $scope.emptySearch = true;
            $scope.nodata = false;
            $scope.directories = [];
        }

        $scope.triggerSearch = function() {
            $scope.loaddata = true;
            $scope.directories = [];
            timer = setTimeout(search, sec);
        };


    }
]);

module.controller('MedicationController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {

        $scope.data = [];
        var isFirstVisit = window.localStorage.getItem('isFirstVisit');
        isFirstVisit = isFirstVisit == null || isFirstVisit == undefined ? true : false;
        $scope.initalCompleted = isFirstVisit ? false : true;
        $scope.accept = isFirstVisit ? false : true;

        var firstMedicationDataSync = function(callback) {
            persistence.schemaSync(function() {

                medications.all().count(function(count) {
                    if (count > 0) {
                        return;
                    }

                    $http({
                        url: 'data/medications.json',
                        method: 'get'
                    }).success(function(data, status, headers, config) {
                        angular.forEach(data, function(item, index, arr) {

                            persistence.add(new medications({
                                server_id: item.server_id,
                                name: item.name,
                                flag: item.flag,
                                is_local: false,
                                last_modified: item.last_modified
                            }));
                        });
                        persistence.flush(callback);
                        window.isInitMedicines = true;
                        $scope.initalCompleted = true;
                    }).error(function(data, status) {

                    })
                });
            });
        }

        $scope.openEditMedication = function(item) {
            myNavigator.pushPage("pages/medication.edit.html", { userMedication: item });
        }
        var loadUserMedication = function() {
            DB.getUserMedications(function(list) {
                $scope.$apply(function() {
                    $scope.data = list;
                })
            })
        }
        $scope.$on('MedicationsRefresh', function() {
            $scope.pageIndex = 0;
            loadUserMedication();
        });

        if (isFirstVisit) {
            ons.notification.alert({
                message: 'The medication reminder functionality is intented as supporting tool only. You must not rely on it to remember to take your medication.',
                title: 'Warning',
                buttonLabel: 'Accept',
                callback: function(result) {
                    $scope.accept = true;
                    firstMedicationDataSync(function() {
                        window.localStorage.setItem('isFirstVisit', false);
                    });
                }
            })
        } else {
            loadUserMedication();
        }


    }
]);

module.controller('MedicationSearchController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce', '$timeout',
    function($scope, $rootScope, $http, $templateCache, $sce, $timeout) {
        $scope.dataCount = 0;
        $scope.query = null;

        $scope.pageIndex = 0;
        $scope.pageSize = 20;
        $scope.data = [];
        $scope.isLoaded = false;



        var timer = null;

        $scope.search = function($event, key) {

            $scope.key = key;
            if (timer) $timeout.cancel(timer);

            timer = $timeout(function() {}, 1000);
            timer.then(
                function() {
                    $scope.doSearch($scope.key, $scope.populateList);
                    //console.log("Timer resolved!", Date.now());
                },
                function() {
                    //console.log("Timer rejected!", Date.now());
                }
            );
        }

        var now = null;
        $scope.doSearch = function(key, callback) {

            $scope.pageIndex = 0;
            now = new Date();
            $scope.isLoading = true;

            $scope.data = [];
            $scope.query = medications.all();
            var keys = key.replace(/\s+/g, ' ').split(' ');
            var filter = null;
            angular.forEach(keys, function(item, index, arr) {

                if (index == 0) {
                    filter = new persistence.PropertyFilter('name', 'like', '%' + item + '%');
                } else {
                    filter = new persistence.AndFilter(filter, new persistence.PropertyFilter('name', 'like', '%' + item + '%'));
                }
            })
            if (filter) {
                $scope.query = $scope.query.and(filter);
            }
            $scope.query.count(function(result) {
                $scope.dataCount = result;
                $scope.isLoaded = true;
                //console.log(moment().diff(now), "millisecond");
                callback();

            });

        }


        $scope.clearInput = function() {
            $scope.key = "";
        }



        $scope.canWeLoadMoreContent = function() {
            return true;
        }

        $scope.populateList = function() {

            if (!$scope.query) return;
            now = new Date();
            $scope.query.limit($scope.pageSize).skip($scope.pageIndex * $scope.pageSize).list(function(data) {
                $scope.$apply(function() {
                    $scope.data = $scope.data.concat(data);
                    $scope.isLoading = false;
                    console.log(moment().diff(now), "millisecond");
                });
            })
            $scope.pageIndex++;
        };


        $scope.load = function($done) {
            $timeout(function() {
                $scope.latestRefreshDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
                $done();

                if (!$scope.isLoading) {
                    $scope.populateList();
                }
            }, 50);
        }
        $scope.dialogs = {};
        $scope.addMedication = function(item, $event) {
            var dlg = "add.html";
            myNavigator.pushPage("pages/medication.edit.html", { medication: item });
        };
        $scope.addNewMedication = function(name, $event) {
            myNavigator.pushPage("pages/medication.edit.html", { name: name, isNew: true });
        };
    }
]);


module.controller('MedicationEditController', ['$scope', function($scope) {
    $scope.options = $scope.myNavigator.getCurrentPage().options;
    $scope.isEdit = false;
    if ($scope.options.isNew) {
        $scope.drug_name = $scope.options.name;
        $scope.isNew = $scope.options.isNew;
    } else if (!$scope.options.medication) {
        $scope.drug_name = $scope.options.userMedication.drug_name;
        $scope.directions = $scope.options.userMedication.directions;
        $scope.isEdit = true;
    } else {
        $scope.drug_name = $scope.options.medication.name;
        $scope.directions = "";
    }
    $scope.deleteUserMedication = function() {
        ons.notification.confirm({
            message: "Do you want delete the Medication?",
            callback: function(result) {
                if (result) {
                    $scope.options.userMedication.status = 1;
                    $scope.options.userMedication.last_amend_date = new Date();
                    persistence.flush(function() {});
                    $scope.$root.$broadcast('MedicationsRefresh');
                    myNavigator.popPage();
                }
            }
        })

    }
    $scope.addClicked = function($event) {
        if ($.trim($scope.directions) == '') {
            ons.notification.alert({
                message: "Please add description.",
                title: "Warning"
            });
            return;
        }
        if ($scope.options.isNew) {
            DB.addNewUserMedication({
                    drug_name: $scope.drug_name,
                    directions: $scope.directions
                },
                function(err) {

                    $scope.$root.$broadcast('MedicationsRefresh');
					myNavigator.pushPage('pages/medication.html');
                    //myNavigator.popPage();
                });
        } else if ($scope.isEdit) {
            $scope.options.userMedication.drug_name = $scope.drug_name;
            $scope.options.userMedication.description = $scope.directions;
            persistence.flush(function() {});
            myNavigator.popPage();
        } else {
            DB.addUserMedication($scope.options.medication, {
                drug_name: $scope.drug_name,
                directions: $scope.directions,
                server_id: $scope.options.medication.server_id,
            }, function(err) {

                $scope.$root.$broadcast('MedicationsRefresh');
				myNavigator.pushPage('pages/medication.html');
            //    myNavigator.popPage();
            })
        }

    };
    
    $scope.orderRepeat = function() {
         ons.notification.alert({
                message: "Thank you, your prescription reorder request has been receieved.",
                title: "Prescription Reorder"
            });
				myNavigator.pushPage('pages/medication.html');
            return;
    };

    

}]);


module.controller('RemindersController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        $scope.data = [];
        var loadReminders = function() {
            $scope.data = [];
            DB.getReminders(function(list) {
                async.each(list, function(reminder, callback) {
                    reminder.userMedications.list(null, function(meds) {
                        reminder.dataMedications = meds;
                        callback(null);
                    })
                }, function(err) {
                    $scope.$apply(function() {
                        $scope.data = list;
                    })
                })

            });
        }
        $scope.$on('RemindersRefresh', function() {
            loadReminders();
        });
        loadReminders();

        $scope.getTitle = function(reminder) {
            if (reminder.type == 1) {
                var days = JSON.parse(reminder.days);
                if (days.length == 7) {
                    return 'Daily';
                }
                return AKHB.utils.getShortDayString(days);
            } else {
                return 'Periodic';
            }
        }
        $scope.openReminder = function(reminder) {
            myNavigator.pushPage('pages/reminders.edit.html', { reminder: reminder });
        };

        $scope.addButtonClick = function() {

            ons.createDialog('pages/popover-reminder-list.html').then(function(dialog) {
                dialog.addReminder = function(type) {
                    myNavigator.pushPage('pages/reminders.edit.html', { type: type });
                    dialog.destroy();
                }
                dialog.on("posthide", function($event) {
                    $event.dialog.destroy();
                });
                dialog.show();
            });
        }
    }
]);


module.controller('ReminderEditController', ['$scope', '$sce', '$timeout',
    function($scope, $sce, $timeout) {
        $scope.options = $scope.myNavigator.getCurrentPage().options;
        if ($scope.options.reminder) {
            $scope.isEdit = true;
        } else {
            $scope.options.reminder = new reminders();
        }
        var now = moment();
        $scope.remind_for = 21;
        $scope.skip_for = 7;
        $scope.daysString = AKHB.utils.daysString;
        $scope.day = new Array(7);
        $scope.checkedMedications = new Array();
        $scope.reminder = {
            start: now.format('YYYY-MM-DD'),
            end: now.add('d', 20).format('YYYY-MM-DD'),
            time: now.add('h', 1)
        };
        if ($scope.isEdit) {
            $scope.remind_for = $scope.options.reminder.remind_for;
            $scope.skip_for = $scope.options.reminder.skip_for;
            $scope.reminder = {
                start: moment($scope.options.reminder.start_date).format('YYYY-MM-DD'),
                end: moment($scope.options.reminder.end_date).format('YYYY-MM-DD'),
                time: moment('1988-01-01 ' + $scope.options.reminder.reminder_time)
            };
            $scope.options.type = $scope.options.reminder.type;
            angular.forEach($scope.options.reminder.days, function(item, index, arr) {
                $scope.day[item] = true;
            });

            $scope.options.reminder.userMedications.list(null, function(meds) {
                angular.forEach(meds, function(med, index) {
                    $scope.checkedMedications.push(med);
                });

                DB.getUserMedications(function(list) {
                    $scope.$apply(function() {
                        $scope.medications = list;
                    })
                });
            })


        } else {
            DB.getUserMedications(function(list) {
                $scope.$apply(function() {
                    $scope.medications = list;
                })
            });
        }


        $scope.dayClick = function(index) {
            if (!$scope.day[index]) {
                $scope.day[index] = true;
            } else {
                $scope.day[index] = false;
            }
        };

        $scope.medicationClick = function(item) {
            var existIndex = $scope.checkedMedications.indexOf(item);

            if (existIndex > -1) {
                //$scope.options.reminder.medications.remove(item);
                //$scope.checkedMedications.remove(item);
                if (existIndex == $scope.checkedMedications.length - 1) {
                    $scope.checkedMedications = $scope.checkedMedications.slice(0, existIndex);
                } else {
                    $scope.checkedMedications = $scope.checkedMedications.slice(0, existIndex).concat(
                        $scope.checkedMedications.slice(existIndex + 1)
                    );
                }
            } else {
                //$scope.options.reminder.medications.add(item);
                $scope.checkedMedications.push(item);
            }
        };
        $scope.medicationCheck = function(item) {
            return $scope.checkedMedications.indexOf(item) > -1;
        }

        $scope.getReminderTime = function() {
            return moment($scope.reminder.time).format('HH:mm');
        }
        $scope.DatePicker = function($event, originDate) {
            var options = {
                date: moment($scope.reminder[originDate]).toDate(),
                mode: 'date'
            };
            if (originDate == 'time') {
                options.mode = 'time';
            }

            function onSuccess(date) {
                switch (originDate) {
                    case 'start':
                        if (moment($scope.reminder.start).toDate() < date) {
                            $scope.reminder.end = moment(date).format('YYYY-MM-DD');
                        }
                        break;
                    case 'end':
                        if (moment($scope.reminder.start).toDate() > date) {
                            $scope.reminder.start = moment(date).format('YYYY-MM-DD');
                        }
                        break;
                    case 'time':
                        $scope.$apply(function() {
                            $scope.reminder.time = moment(date).toDate();
                        });

                        return;
                    default:
                        break;
                }
                $scope.$apply(function() {
                    $scope.reminder[originDate] = moment(date).format('YYYY-MM-DD');
                });

            }

            function onError(error) { // Android only 
                console.log(error);
            }
            if (typeof datePicker !== 'undefined') {
                datePicker.show(options, onSuccess, onError);
            }
        };
        $scope.save = function($event) {
            var checkedDays = [];
            angular.forEach($scope.day, function(item, index, arr) {
                if (item) {
                    checkedDays.push(index);
                }
            })

            if (checkedDays.length < 1 && $scope.options.type == 1) {
                ons.notification.alert({
                    title: 'Warning',
                    message: 'Please checked a day.'
                });
                return;
            }

            if ($scope.checkedMedications.length < 1) {

                ons.notification.alert({
                    title: 'Warning',
                    message: 'Please checked a medication.'
                });
                return;
            }


            $scope.options.reminder.days = $scope.options.type == 1 ? JSON.stringify(checkedDays) : null;
            $scope.options.reminder.start_date = $scope.reminder.start;
            $scope.options.reminder.end_date = $scope.reminder.end;
            $scope.options.reminder.reminder_time = moment($scope.reminder.time).format("HH:mm");
            $scope.options.reminder.remind_for = $scope.options.type == 2 ? $scope.remind_for : null;
            $scope.options.reminder.skip_for = $scope.options.type == 2 ? $scope.skip_for : null;
            $scope.options.reminder.last_amend_date = new Date();
            $scope.options.reminder.description = JSON.stringify($scope.checkedMedicationsDescription);

            if (!$scope.isEdit) {


                $scope.options.reminder.type = $scope.options.type;
                $scope.options.reminder.status = 0;

                DB.addReminder($scope.checkedMedications, $scope.options.reminder, function() {
                    $scope.$root.$broadcast('RemindersRefresh');
                    myNavigator.popPage();
                });


            } else {

                DB.updateReminder($scope.checkedMedications, $scope.options.reminder, function() {
                    $scope.$root.$broadcast('RemindersRefresh');
                    myNavigator.popPage();
                })
            }

        }
        $scope.deleteReminder = function() {
            if ($scope.isEdit) {
                ons.notification.confirm({
                    message: "Delete this reminder?",
                    callback: function(result) {
                        if (result) {
                            DB.deleteReminder($scope.options.reminder, function() {
                                $scope.$root.$broadcast('RemindersRefresh');
                                myNavigator.popPage();
                            })
                        }
                    }
                })
            }
        }

        //  $scope.generateLocalNotification = AKHB.utils.generateLocalNotification;
    }
]);

module.controller('ScheduleController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {
        DB.getTodaySchedules(function(list) {
            $scope.$apply(function() {
                $scope.data = list;
                window.isFromLocalNotification = false;
            })
        });

        $scope.isActive = function(item) {
            return Math.abs(moment().diff(item.trigger_at, 'm')) <= 30;
        }

        $scope.getTime = function(item) {
            return moment(item.trigger_at).format('hh:mm A');
        };
    }
]);

module.controller('SurveyController', ['$scope', '$rootScope', '$http', '$templateCache', '$sce',
    function($scope, $rootScope, $http, $templateCache, $sce) {

    }
]);



$(document).on('click', 'a', function(e) {

        var $this = $(this);
        var $href = $this.attr('href');
        var $target = $this.attr('target');
        if ($target != '_blank') { $target = '_self'; }
        if ($href != '') {
            e.preventDefault();

            if ($href.toLowerCase().indexOf('http') == 0) {

                if ($target == '') {
                    if (!Auth.isNetworkConnected()) {
                        AKHB.notification.alert('Sorry, a network connection is required, please try later.', null, 'Internet Connection', 'Try Later');
                    } else {
                        ref = window.open($href, '_blank', 'location=no,hidden=yes,toolbar=yes,enableViewportScale=yes,toolbarposition=top');
                        $('div.loading').removeClass('ng-hide');
                        ref.addEventListener('loadstop', function() {
                            ref.show();
                            $('div.loading').addClass('ng-hide');
                        });
                    }
                }
                if ($target.toLowerCase().indexOf('_blank') == 0) {

                    navigator.notification.confirm(
                        "Would you like to open this link in your browser?",
                        function(buttonIndex) {
                            if (buttonIndex == 1) {
                                window.open($href, '_system');
                            }
                        },
                        'External Link', ["Open", "Cancel"]
                    );
                } else if ($target.toLowerCase().indexOf('_self') == 0) {
                    if (!Auth.isNetworkConnected()) {
                        AKHB.notification.alert('Sorry, a network connection is required, please try later.', null, 'Internet Connection', 'Try Later');
                    } else {
                        ref = window.open($href, '_blank', 'location=no,hidden=yes,toolbar=yes,enableViewportScale=yes,toolbarposition=top');
                        $('div.loading').removeClass('ng-hide');
                        ref.addEventListener('loadstop', function() {
                            ref.show();
                            $('div.loading').addClass('ng-hide');
                        });
                    }
                }

            } else if ($href.toLowerCase().indexOf('tel') == 0) {
                navigator.notification.confirm(
                    "",
                    function(buttonIndex) {
                        if (buttonIndex == 1) {
                            window.open($href, '_system', 'location=yes');
                        }
                    },
                    $(this).text(), ["Call", "Cancel"]
                );

            } else if ($href.toLowerCase().indexOf('mailto') == 0) {
                window.plugin.email.open({
                    to: [$href.substring(7)]
                });
            } else {
                window.open($href, '_system', 'location=yes');
            }

        }
    })
    /*.on('swipe','ons-list-item.swipe',function(e){
        console.log('left',e);
        //$(this).
    })*/
;



//define filter
module.filter('safePhone', function($sce) {
    return function(input) {
        if (input)
            return input.replace(/\ +/g, "");
        else
            return '';
    }
});
module.filter('trustHtml', function($sce) {
    return function(input) {
        return $sce.trustAsHtml(input);
    }
});
module.filter('trustHtmlA', function($sce) {
    return function(input) {
        return $sce.trustAsHtml(input.replace(/<[^>]+>/g, ""));
    }
});
module.filter('formatTime', function($sce) {
    return function(input) {
        if (input)
            return $sce.trustAsHtml(moment(input).format('YYYY/MM/DD h:mm A'));
        return "";
    }
});


function tokenHandler(result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
    //alert('device token = ' + result);
    sendRegistionId(result);
}
// result contains any message sent from the plugin call
function successHandler(result) {
    //sendRegistionId(result);
}
// result contains any error description text returned from the plugin call
function errorHandler(error) {
    navigator.notification.alert('error = ' + error, null, 'Error');
}

function sendRegistionId(id) {
    var url = window.AKHB.config.remoteAddress + '?type=4&version=' + AKHB.user.appVersion + '&os=' + AKHB.user.os + '&device=' + AKHB.user.deviceName + '&deviceid=' + AKHB.user.deviceid + '&notificationid=' + id;
    $.get(url, function(data) {})
}

// notificationFeedback Service
function notificationFeedback(buttonIndex, passedData) {
    var url = window.AKHB.config.remoteAddress + '?type=5&uuid=' + AKHB.user.id + '&other=' + passedData + '&buttonIndex=' + buttonIndex;
    $.get(url, function(data) {})
}


// added badge update function
function updateBadge(badgeCount) {
    var pushNotification = window.plugins.pushNotification;
    pushNotification.setApplicationIconBadgeNumber(successHandler, successHandler, badgeCount);
    //cordova.plugins.notification.badge.set(badgeCount); // Android
}

// iOS
function onNotificationAPN(event) {
    if (event.alert) {
        if (event.type == '2') {
            navigator.notification.confirm(
                event.alert,
                function(buttonIndex) {
                    notificationFeedback(buttonIndex, event.other);
                },
                event.title,
                event.buttons
            );

        } else {
            navigator.notification.alert(event.alert, null, event.title);
        }
    }

    if (event.sound) {
        var snd = new Media(event.sound);
        snd.play();
    }

    if (event.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}

//Android and Amazon Fire OS 
function onNotificationGCM(e) {
    //$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                sendRegistionId(e.regid);
            }
            break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground) {

                // on Android soundname is outside the payload.
                // On Amazon FireOS all custom attributes are contained within payload
                var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                var my_media = new Media("/android_asset/www/" + soundfile);
                my_media.play();
            }
            //        navigator.notification.alert('message = '+e.message+' msgcnt = '+e.msgcnt,null,'New Notification');

            if (e.payload.type == '2') {
                //navigator.notification.confirm(e.message,adminLogin,'IIUK.org',['Cancel','Login']);
                navigator.notification.confirm(
                    e.message,
                    function(buttonIndex) {
                        notificationFeedback(buttonIndex, e.payload.other);
                    },
                    e.payload.title,
                    e.payload.buttons
                );

            } else {
                navigator.notification.alert(e.message, null, e.payload.title);
            }

            break;

        case 'error':
            navigator.notification.alert('GCM error = ' + e.msg, null, 'Error');
            break;

        default:
            navigator.notification.alert('An unknown GCM event has occurred', null, 'Error');
            break;
    }
}
