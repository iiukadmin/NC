
//ons.disableAutoStatusBarFill();  // (Monaca enables StatusBar plugin by  
var MSG_RETUIREDNETWORK = {title:'Internet Connection',content:'Sorry, a network connection is required, please try later.'};
var MSG_LOGINFAILED = {title:'Incorrect Password',content:'Please check password and try again.'};
var MSG_SYSTEMERROR = {title:'System Error',content:'There has been an error,Please contact <a href="mailto:enquiries@iiuk.org">enquiries@iiuk.org</a>. <br /> Error Code:{0}'};

var pushNotification;
var module = ons.bootstrap('AKHB', ['onsen','ngTouch']);
AKHB.user = { id:null, authcode:null,appVersion:'1.0'};

var DB = null;

AKHB.openContentPage =  function(navigation,$templateCache){
    if(navigation.type == 1){

    }else if(!isNaN(navigation.content)){
        DB.getArticleById(navigation.content,function(err,article){
            // if(article.type == 2){
            //     window.open(article.content);
            // }else if(article.type == 1){
                //$scope.myNavigator.pushPage('pages/content.html',{article:article});
                $templateCache.put('article', article);
                //app.slidingMenu.setMainPage('pages/content.html',{closeMenu: true});
                myNavigator.pushPage('pages/content.html',{article:article});
            // }
        });
    }
}


module.controller('AppController',['$scope','$rootScope',function($scope,$rootScope){
    
    $rootScope.$on("BUSY", function(){ 
        $scope.busy = true;
        $scope.waitNetwork = false;
        console.log('emit BUSY',$scope.busy,$scope.$id);
    });
    $rootScope.$on("NOTBUSY", function(){    
        $scope.busy = false;
        $scope.waitNetwork = false;
        console.log('emit NOTBUSY',$scope.busy,$scope.$id);
    });
    $rootScope.$on("WAITINGNETWORK", function(){    
        $scope.busy = true;
        $scope.waitNetwork = true;
        console.log('emit WAITINGNETWORK',$scope.busy,$scope.$id);
    });

    
    document.addEventListener('deviceready', function(){
    

    
    if(!window.plugins || !window.plugins.pushNotification) return;
    try{
       
        var pushNotification = window.plugins.pushNotification;

        //regist notification
        if ( device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos" ){
            pushNotification.register(
            successHandler,
            errorHandler,
            {
                "senderID":window.AKHB.config.senderID,
                "ecb":"onNotificationGCM"
            });
        } else if ( device.platform == 'blackberry10'){
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
            errorHandler,
            {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":"onNotificationAPN"
            });
        }
        
    }catch(ex){
        console.log("Notification error:",ex);
    }

    }, false);
}]);

module.controller('SlidingMenuController',['$scope',function($scope){
    $scope.$on("isready", function(event,data){ 
        $scope.isready = data;
    });
}]);
module.controller('LandingPageController',['$scope','$sce','$templateCache',function($scope,$sce,$templateCache){
    var scope = $scope;

     $scope.openPage = function(nav){
        $templateCache.put('navigation',nav);
        console.log('navigation',nav.title);
        if(nav.type==2){
            AKHB.openContentPage(nav,$templateCache);
        }else if(nav.type==3){
            app.slidingMenu.setMainPage('pages/messagelistpage.html', { closeMenu: true })
        }else if(nav.type==5){
            app.slidingMenu.setMainPage('pages/directoryindex.html', { closeMenu: true })
        }else if(nav.type==4){
            signOut();
        }else{
            myNavigator.pushPage('pages/childmenu.html');
        }
        
    }
    var signOut = function(){
        var Auth = new AKHB.services.authentication(AKHB.config);
        Auth.cleanAuthentication(function(){
            app.slidingMenu.setSwipeable(false); 
            app.slidingMenu.closeMenu();
            app.slidingMenu.setMainPage('pages/login.html');    
        });
    }
    $scope.signOut = signOut;
    DB.getHomeArticle(function(err,result){
        DB.getHomepageIcons(function(err,navigations){
            DB.getUnreadMessageCount(function(err,count){
                scope.$apply( function() {
                    $scope.messageCount = count;
                    $scope.hasMessage = count > 0;
                    $scope.navigations = navigations;
                    $scope.title = $sce.trustAsHtml(result.title);
                    $scope.article = $sce.trustAsHtml(result.content);
                });
            });
        })  
    });

}]);

module.controller('MessageListController',['$scope','$rootScope','$templateCache',function($scope,$rootScope,$templateCache){
    var scope = $scope;
    scope.nav =  $templateCache.get('navigation');
    scope.menuClick = function(){
        // app.slidingMenu.setSwipeable(true);
        app.slidingMenu.toggleMenu();
        // app.slidingMenu.once('postclose',function(){
        //      app.slidingMenu.setSwipeable(false);
        // });
    };
    scope.openMessageDetail = function(msg){
        // if(msg.type == 1){
        //     DB.setMessageUsed(msg.server_id,function(err,result){
        //         msg.type = 2;
        //         console.log(err,result);
        //     });
        // }
        // AKHB.notification.alert(msg.content,null,msg.title);
        $templateCache.put('message', msg);
        myNavigator.pushPage('pages/messagedetail.html');
    };
    var loadMessage = function(){
       DB.getMessages(function(err,messages){
        console.log(messages);
            scope.$apply( function() {
                scope.messages = messages;
            });
        }) 
    }
    loadMessage();
    $scope.$on("Refresh", function(){ 
        loadMessage();
        console.log('emit Refresh');
    });
    $scope.swipeLeft = function($event){
        var target = $($event.target);
        if(!$($event.target).hasClass('swipe')){
            target = $($event.target).parents('.swipe:eq(0)').get(0);
        }
        $(target).addClass('show-del-btn');
    };
    $scope.swipeRight = function($event){
         var target = $($event.target);
         if($event.target.tagName.toLowerCase() != 'ons-list-item'){
            if($(target.parents('ons-list-item:eq(0)').get(0)).offset().left == 0){
                app.slidingMenu.openMenu();
                app.slidingMenu.setSwipeable(true);
                return;
            }
         }
        if(!$($event.target).hasClass('swipe')){
            target = $($event.target).parents('.swipe:eq(0)').get(0);
        }
        $(target).removeClass('show-del-btn');
    };
    $scope.deleteMessage = function(msg,$event){
        $event.stopPropagation();
        ons.notification.confirm({
            message: 'Are you sure you want to delete?',
            callback: function(answer) {
              if(answer){
                DB.deleteMessage(msg.server_id,function(){
                    $rootScope.$broadcast("Refresh");
                });
              }
            }
        });
        
    };
}]);
module.controller('MessageDetailController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        var scope = $scope;
        var message = $templateCache.get('message');
        $scope.message = message;
        message.status = 1;
        DB.setUsage(message.server_id,1);
        persistence.flush();
        
        $scope.deleteMessage = function(){
            ons.notification.confirm({
                message: 'Are you sure you want to delete?',
                callback: function(answer) {
                  if(answer){
                    DB.deleteMessage(message.server_id,function(){
                        DB.setUsage(message.server_id,2);
                        $rootScope.$broadcast("Refresh");
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
}]);


module.controller('LoginController',['$scope','$http','$templateCache','$rootScope',
    function($scope, $http, $templateCache,$rootScope) {

        app.slidingMenu.setSwipeable(false); 

        var Auth = new AKHB.services.authentication(AKHB.config);
        var DBSync = null;
        var scope = $scope;
        var rootScope = $rootScope;

        scope.isready = true; 

        ons.ready(function(){
            if(typeof device == 'undefined'){
                AKHB.user.deviceid = '00000000000000031';
                AKHB.user.os = 'test';
                AKHB.user.deviceName = 'browser test';
            }else{
                AKHB.user.deviceid = device.uuid;
                AKHB.user.os = device.version;
                AKHB.user.deviceName = device.model;
                if(typeof getAppVersion == 'function'){
                    getAppVersion(function(version) {
                        AKHB.user.appVersion = version;
                        console.log('Native App Version: ' + version);
                    });
                }
            };
            scope.$apply(function(){
                scope.isready = true;         
            })
            setTimeout(function(){
                DB =  new AKHB.services.db(function(){
                    DBSync = new AKHB.services.db.DBSync(AKHB.config,$http);
                    initLogin();
                });  

            },100);           
        });
        
        function initLogin(){
            var onlineLogin = function(){
                Auth.isWebserviceWorking($http,function(err,result){
                    rootScope.$emit("NOTBUSY");
                    if(err){
                        AKHB.notification.alert(result.content,function(){
                            AKHB.utils.exitApp();
                        },result.title);
                    }else{  
                        scope.login = function(){
                            var password = scope.password;
                            var userName = scope.username;
                            var authData = Auth.AuthenticationRequest(AKHB.user.deviceid,userName,password);
                            rootScope.$emit("BUSY");
                            Auth.checkRemoteAuthentication($http,authData,function(err,result){
                                
                                if(err) {
                                    AKHB.notification.alert(result.content,null,result.title);
                                    rootScope.$emit("NOTBUSY");
                                }
                                else{
                                    
                                    DBSync.runInBackGround(function(err){
                                        rootScope.$emit("NOTBUSY");
                                        app.slidingMenu.setSwipeable(true);
                                        app.slidingMenu.setMainPage('pages/landingpage.html');
                                        syncBackGround();
                                    });
                                }
                                
                            });
                        }
                        
                    }
                });
            }
             try{
                //rootScope.$emit("BUSY"); 
                // check network and server.
                var syncTimes = 0;
                var syncBackGround = function(){
                    syncTimes ++;
                    if(Auth.checkNetworkConnected()){
                        DBSync.runInBackGround(function(){
                            setTimeout(function(){
                                console.log('sync times:'+syncTimes);
                                syncBackGround();
                            },10*60*1000);
                        });
                    }else{
                        setTimeout(function(){
                            console.log('sync times:'+syncTimes);
                            syncBackGround();
                        },60000);
                    }
                }
                if(Auth.isCachedAuthentication()){
                    $rootScope.$emit("NOTBUSY");
                    app.slidingMenu.setSwipeable(true); 
                    app.slidingMenu.setMainPage('pages/landingpage.html');
                    var user = JSON.parse(Auth.getCachedAuthentication());
                    AKHB.user = user;
                    DBSync.runInBackGround(function(err){
                        //$rootScope.$emit("BUSY");
                        syncBackGround();
                    });
                }else{
                    //Auth.checkNetworkConnected();
                    onlineLogin();
                }
            }catch(ex){
                console.log(ex);
                rootScope.$emit("WAITINGNETWORK");
                if(ex.message == 'nonetwork')
                    AKHB.notification.alert(MSG_RETUIREDNETWORK.content,function(){
                        //AKHB.utils.exitApp();
                    },MSG_RETUIREDNETWORK.title);
                document.addEventListener("online", function(){
                    rootScope.$emit("NOTBUSY");
                    onlineLogin();
                }, false);
            }
        }
    
}]);


module.controller('MenuController',['$scope','$http','$templateCache',
    function($scope, $http, $templateCache) {
        $scope.openPage = function(nav){
            $templateCache.put('navigation',nav);
            console.log('MenuController',nav.title);
            if(nav.type==2){
                AKHB.openContentPage(nav,$templateCache);
            }else if(nav.type==3){
                app.slidingMenu.setMainPage('pages/messagelistpage.html', { closeMenu: true })
            }else if(nav.type==5){
                app.slidingMenu.setMainPage('pages/directoryindex.html', { closeMenu: true })
            }else if(nav.type==4){
                signOut();
            }else{
                myNavigator.pushPage('pages/childmenu.html');
            }
            
        }
        var signOut = function(){
            var Auth = new AKHB.services.authentication(AKHB.config);
            Auth.cleanAuthentication(function(){
                app.slidingMenu.setSwipeable(false); 
                app.slidingMenu.closeMenu();
                app.slidingMenu.setMainPage('pages/login.html');    
            });
        }
        $scope.signOut = signOut;
        $scope.navigations = [];
        var loadMenu = function(scope){
            DB.getNavigationsByParentId(0,function(err,navigations){
                scope.$apply( function() {
                    scope.navigations = navigations;
                });
            });
        }

        app.slidingMenu.on('preopen',function(){
            loadMenu($scope);
        });

       //  $scope.toggle = function(obj){
       //      console.log(obj);
       //      $templateCache.put('navigation',obj);
       //      myNavigator.pushPage('pages/childmenu.html');
       // }
       
}]);



module.controller('ChildMenuController',['$scope','$http','$templateCache','$sce',
    function($scope, $http, $templateCache,$sce) {
        $scope.navigation = $templateCache.get('navigation');
        $scope.openPage = function(nav){
            $templateCache.put('navigation',nav);
            app.slidingMenu.setSwipeable(true); 
            if(nav.type==2){
                AKHB.openContentPage(nav,$templateCache);
            }else{
                
                myNavigator.pushPage('pages/childmenu.html');
            }
        }

        //$scope.contentHTML = $sce.trustAsHtml(article.content);
        DB.getNavigationsByParentId($scope.navigation.server_id, function(err,results){
            async.each(results,function(nav,callback){
                if(nav.type==1){
                    DB.getNavigationsByParentId(nav.server_id,function(err,navigations){
                       nav.children =  navigations;
                       callback(null);
                    });
                }else{
                    callback(null);
                }
            },function(err,result){
                $scope.$apply( function() {
                    $scope.childNavigations = results;
                });
            });
            
        });
}]);


module.controller('ContentController',['$scope','$http','$templateCache','$sce','$rootScope',
    function($scope, $http, $templateCache,$sce,$rootScope) {
        var Auth = new AKHB.services.authentication(AKHB.config);

        var article = $templateCache.get('article');

        window.rootScope = $rootScope;
        if(article == null) return;
        $scope.article = article;
        $scope.nav = $templateCache.get('navigation');
        DB.setUsage(article.server_id,1);
        if(article.type==2){
            if(!Auth.isNetworkConnected()){
                $scope.contentHTML = $sce.trustAsHtml("<p class=empty-content>"+MSG_RETUIREDNETWORK.content+"</p>");
            }else{
                if(article.content.toLowerCase().indexOf('http') == -1) 
                    article.content = 'http://'+article.content;
                
                if(article.content.indexOf('?') > -1)
                    article.content += '&';
                else
                    article.content += '?';

                article.content +='uuid='+AKHB.user.id;

                //用插件打開
                //------------------------------------------------------------------------
                // var ref = window.open(article.content,'_blank','location=yes');
                // //exit
                // ref.addEventListener('exit', function() { 
                //     myNavigator.popPage();
                // });
                //------------------------------------------------------------------------

                $scope.contentHTML = $sce.trustAsHtml('<iframe name="contentFrame" id="content-iframe" src="'+article.content +'" ng-if="article.type==2"></iframe>');

                //$scope.contentHTML = $sce.trustAsHtml('<iframe id="content-iframe" src="http://127.0.0.1" ng-if="article.type==2"></iframe>');
                $('div.loading').removeClass('ng-hide');
                setTimeout(function(){
                   // $rootScope.$emit("BUSY");
                    $('div.loading').addClass('ng-hide');
                },5000);
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
        }else{

            $scope.contentHTML = $sce.trustAsHtml(article.content);

        }
        DB.getMessageCount(function(err,count){
             $scope.$apply( function() {
                $scope.hasMessage = count > 0;
            });
        });
        
}]);

module.controller('DirectoryController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        
        $scope.nav = $templateCache.get('navigation');
        console.log('DirectoryController',$scope.nav.title );

        $scope.OpenDirectoryPage = function($event,type){
            var dict = {
                title : $($event.target).text(),
                type:type.id
            };
            DB.getDirectoriesCount(type.id,function(err,data){
                dict.count = data;
                if(dict.count > 0){
                    $templateCache.put('dict',dict);
                    myNavigator.pushPage('pages/directorylist.html');    
                }else{
                    AKHB.notification.alert("No directory data.",function(){
                        //AKHB.utils.exitApp();
                    });
                }
                
            });

        }
        console.log("getDirectoryCategories");
        DB.getDirectoryCategories(function(err,data){
            $scope.$apply(function(){
                $scope.categories = data;
            });
        })


        var timer = null;
        var sec = 500;
        $scope.loaddata = false;
        $scope.directories = [];
        $scope.persons = [];      
        $scope.emptySearch = true;
        $scope.noCommitteesData  = false;
        $scope.noPersonsData  = false;

        $scope.OpenDirectoryDetail = function(directory){
            $templateCache.put('directory',directory);
            myNavigator.pushPage('pages/directorydetail.html');
        };

        $scope.openIndividual = function(individual){

            DB.getCommitteById(individual.id,function(err,data){
                if(!err && data){
                    $templateCache.put('directory',data);
                    myNavigator.pushPage('pages/directorydetail.html');
                }else{
                    
                    $templateCache.put('individual',individual.content);
                    myNavigator.pushPage('pages/directoryindividual.html');
                }
            })
            
        };

        $scope.clearInput = function(){

            $scope.key = '';
            $scope.emptySearch = true;
            $scope.loaddata = false;  
            $scope.noCommitteesData  = true;
            $scope.noPersonsData  = true;
            $scope.directories = [];
            $scope.persons = [];
        }

        var search = function(){
            $scope.$apply(function(){
                $scope.noCommitteesData  = false;
                $scope.noPersonsData  = false;
            })
            if(timer){
                clearTimeout(timer);
                if($.trim($scope.key) == ''){
                    $scope.$apply(function(){
                        $scope.emptySearch = true;
                        $scope.loaddata = false;  
                        $scope.noCommitteesData  = false;
                        $scope.noPersonsData  = false;
                    })
                    return;
                }
                
            }

            timer = setTimeout(function(){
                var data = {};
                $scope.key =  $.trim($scope.key.replace(/\s+/g, ' '));
                async.series([
                    function(callback){
                        DB.searchCommittees($scope.key,function(err,committees){
                            data.committees = committees;
                            callback(err);
                        });
                    },
                    function(callback){
                        DB.searchPersons($scope.key,function(err,persons){
                            data.persons = persons;
                            callback(err);
                        });
                    }
                ],function(err){
                     if(!err){
                        $scope.$apply(function(){
                            $scope.noCommitteesData  = data.committees.length == 0;
                            $scope.noPersonsData  = data.persons.length == 0;
                            $scope.loaddata = false;
                            $scope.directories = data.committees;
                            $scope.persons = data.persons;
                        });
                    }
                });
  
            },sec);
        };
        $scope.triggerSearch = function(){
            $scope.loaddata = true;
            $scope.emptySearch = false;
            $scope.directories = [];
            timer = setTimeout(search,sec);
        };

}]);
module.controller('DirectoryListController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        $scope.dict = $templateCache.get('dict');
        $scope.dict.data = [];
        $scope.OpenDirectoryDetail = function(directory){
            $templateCache.put('directory',directory);
            myNavigator.pushPage('pages/directorydetail.html');
        };
        $scope.MyDelegate  = {
          configureItemScope: function(index, itemScope) {
 
            DB.getDirectoriesPagnation($scope.dict.type,index,function(err,data){
                $scope.$apply(function(){
                    if(data.length > 0) itemScope.item = data[0];
                })
                
             });
          },
          calculateItemHeight: function(index) {
            return 45;
          },
          countItems: function() {
            return $scope.dict.count;
          },
          destroyItemScope: function(index, scope) {
            //console.log("Destroyed item #" + index);
          }
        };
}]);

module.controller('DirectoryDetailController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        $scope.directory = $templateCache.get('directory');
        if(typeof $scope.directory.members == "undefined")
            $scope.directory.members = JSON.parse($scope.directory.content);

        $scope.openIndividual = function(individual){
            $templateCache.put('individual',individual);
            myNavigator.pushPage('pages/directoryindividual.html');
        };
}]);
module.controller('DirectoryIndividualController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        $scope.individual = $templateCache.get('individual');
        $scope.openIndividual = function(individual){

            DB.getCommitteById(individual.id,function(err,data){
                if(!err && data){
                    $templateCache.put('directory',data);
                    myNavigator.pushPage('pages/directorydetail.html');
                }else{
                    $templateCache.put('individual',individual);
                    myNavigator.pushPage('pages/directoryindividual.html');
                }
            })
            
        };
}]);
module.controller('DirectoryDescriptionController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        $scope.directory = $templateCache.get('directory');
}]);
module.controller('DirectorySearchController',['$scope','$rootScope','$http','$templateCache','$sce',
    function($scope,$rootScope,$http, $templateCache,$sce) {
        var timer = null;
        var sec = 500;
        $scope.loaddata = false;
        $scope.directories = [];
        
        $scope.OpenDirectoryDetail = function(directory){
            $templateCache.put('directory',directory);
            myNavigator.pushPage('pages/directorydetail.html');
        };

        var search = function(){
            if(timer){
                clearTimeout(timer);
                if($.trim($scope.key) == ''){
                    $scope.loaddata = false;
                    return;
                }
            }

            timer = setTimeout(function(){
                
                DB.searchDirectories($scope.key,function(err,data){
                    if(!err){
                        $scope.$apply(function(){
                            $scope.loaddata = false;
                            $scope.directories = data;
                        });
                    }
                });
            },sec);
        };

        $scope.clearInput = function(){
            $scope.key = '';
            $scope.emptySearch = true;
            $scope.nodata  = false;  
            $scope.directories = [];
        }

        $scope.triggerSearch = function(){
            $scope.loaddata = true;
            $scope.directories = [];
            timer = setTimeout(search,sec);
        };

        
}]);


$(document).on('touchstart touchend','#list-message',function(e){

    app.slidingMenu.setSwipeable(false); 
    e.stopPropagation();
    e.preventDefault();
    if(window.swipTimer) clearTimeout(window.swipTimer);
    window.swipTimer = setTimeout(function(){
        app.slidingMenu.setSwipeable(true); 
    },2000);
})

$(document).on('click','a',function(e){

        var $this = $(this);
        var $href = $this.attr('href');
        if($href != ''){
            e.preventDefault();
            if($href.toLowerCase().indexOf('http') == 0){
                window.open( $href, '_blank', 'location=yes');

            }else if($href.toLowerCase().indexOf('mailto') == 0){
                window.plugin.email.open({
                    to:[$href.substring(7)]
                });
            }else{
                 window.open( $href, '_system', 'location=yes');
            }
        } 
})
/*.on('swipe','ons-list-item.swipe',function(e){
    console.log('left',e);
    //$(this).
})*/
;



//define filter
module.filter('safePhone', function ($sce) {
    return function (input) {
        if(input) 
            return input.replace(/\ +/g,"");
        else
            return '';
    }
});
module.filter('trustHtml', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
});
module.filter('formatTime', function ($sce) {
    return function (input) {
        if(input)
            return $sce.trustAsHtml(moment(input).format('YYYY/MM/DD h:mm A'));
        return "";
    }
});


function tokenHandler (result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
    //alert('device token = ' + result);
    sendRegistionId(result);
}
// result contains any message sent from the plugin call
function successHandler (result) {
   console.log('result = ' + result);
   //sendRegistionId(result);
}
// result contains any error description text returned from the plugin call
function errorHandler (error) {
    alert('error = ' + error);
}
function sendRegistionId(id){
    console.log("sendRegistionId",id);
    var url = window.AKHB.config.remoteAddress+'/webservice.php?type=4&deviceid='+AKHB.user.deviceid+'&notificationid=' + id;
    $.get(url,function(data){
        console.log('sendRegistionId',id,data);
    })
}
// iOS
function onNotificationAPN (event) {
    if ( event.alert )
    {
        navigator.notification.alert(event.alert);
    }

    if ( event.sound )
    {
        var snd = new Media(event.sound);
        snd.play();
    }

    if ( event.badge )
    {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}

//Android and Amazon Fire OS 
function onNotificationGCM(e) {
   //$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');
    switch( e.event )
    {
    case 'registered':
        if ( e.regid.length > 0 )
        {
            sendRegistionId(e.regid);
        }
    break;

    case 'message':
        // if this flag is set, this notification happened while we were in the foreground.
        // you might want to play a sound to get the user's attention, throw up a dialog, etc.
        if ( e.foreground )
        {

            // on Android soundname is outside the payload.
            // On Amazon FireOS all custom attributes are contained within payload
            var soundfile = e.soundname || e.payload.sound;
            // if the notification contains a soundname, play it.
            var my_media = new Media("/android_asset/www/"+ soundfile);
            my_media.play();
        }
        alert('message = '+e.message+' msgcnt = '+e.msgcnt);

    break;

    case 'error':
       alert('GCM error = '+e.msg);
    break;

    default:
        alert('An unknown GCM event has occurred');
    break;
  }
}


/*

function ClickOpen() {
    var dom = $('#childMenu');
    if (dom.hasClass('visibleMenu')) {
        dom.addClass('hiddenMenu');
        dom.removeClass('visibleMenu');
    }
    else if (dom.hasClass('hiddenMenu')) {
        dom.removeClass('hiddenMenu');
        dom.addClass('visibleMenu');            
    }
} 

angular.module('AKHB',[])
.controller('LoginController',['$scope','$http','$templateCache',
    function($scope, $http, $templateCache) {
        var Auth = new AKHB.services.authentication(AKHB.config);

        try{
            // check network and server.
            Auth.checkNetworkConnected();
            Auth.isWebserviceWorking($http,function(err,result){
                if(err){
                    AKHB.notification.alert(result,function(){
                        AKHB.utils.exitApp();
                    });
                }else{
                    doLogin();
                }
            });
        }catch(ex){
            console.log(ex);
            AKHB.notification.alert(ex.message,function(){
                AKHB.utils.exitApp();
            });
        }
        function doLogin(){
            if(Auth.isCachedAuthentication()){
                myNavigator.pushPage('main.html');
            }else{
                $(document).on('click','#btn_login',function(){
                    var pwd = $('#loginpwd').val();
                    var authData = Auth.AuthenticationRequest(AKHB.user.deviceid,pwd);

                    Auth.checkRemoteAuthentication($http,authData,function(err,result){
                        if(err) 
                            AKHB.notification.alert(result);
                        else
                            myNavigator.pushPage('main.html');
                    });
                });
            };
        };
}]);

ons.ready(function() {
      // Init code here
      // init longin button
    AKHB.user = {
        deviceid:null,
        id:null,
        authcode:null,
        os:null,
        deviceName:null
    };
    if(AKHB.config.debug){
        AKHB.user.deviceid = '00000000000000006';
        AKHB.user.os = 'test';
        AKHB.user.deviceName = 'browser test';
    }else{
        AKHB.user.deviceid = device.uuid;
        AKHB.user.os = device.version;
        AKHB.user.deviceName = device.model;
    }
    ;

   

    
})


*/