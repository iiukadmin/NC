if(typeof(AKHB) == 'undefined'){
	AKHB = {};
}
if(typeof(AKHB.services) == 'undefined'){
	AKHB.services = {};
}
if(typeof(AKHB.services.authentication) == 'undefined'){
	AKHB.services.authentication = {};
}
//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=1&authcode=akhb&deviceid=12332
//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=1&authcode=wrong&deviceid=12332
AKHB.services.authentication = (function(){

	return function(appConfig){

		this.AuthenticationRequest = function(deviceid,userName,password){
			return {
				deviceid:deviceid,
				password:password,
				username:userName,
				type:1
			};
		}
		this.isCachedAuthentication = function(){
			var storeAuthentication = localStorage.getItem('Authentication')
			if(!storeAuthentication || storeAuthentication =='') return false;
			return true;
		};
		this.getCachedAuthentication = function(){
			return localStorage.getItem('Authentication')
		};
		this.captureAuthentication = function(data){
			localStorage.setItem('Authentication',JSON.stringify(data));
		};
		this.cleanAuthentication = function(callback){
			localStorage.removeItem('Authentication');
			persistence.reset(function(){
				if(typeof callback == 'function') callback();
			});
			
		};
		this.checkNetworkConnected = function(){
			//console.log("checkNetworkConnected",typeof device ,navigator.network , navigator.network.connection , navigator.network.connection.type);
			if(typeof device != "undefined"){
				if(navigator.network && navigator.network.connection && navigator.network.connection.type == Connection.NONE)
					throw new Error('nonetwork');
			}
			return true;
		};
		this.isNetworkConnected = function(){
			//console.log("isNetworkConnected",typeof device ,navigator.network , navigator.network.connection , navigator.network.connection.type);
			if(typeof device != "undefined"){
				return navigator.network && navigator.network.connection && navigator.network.connection.type != Connection.NONE;
			}
			return true;
		};
		this.isWebserviceWorking = function($http,callback){
			callback(false,null);
			// $http({
			// 	url:appConfig.remoteAddress + '/webservice.php',
			// 	timeout:appConfig.timeout,
			// 	type:'GET',
			// 	// success :function(data){
			// 	// 	callback(false,data);
			// 	// },
			// 	// complete : function(XMLHttpRequest,status){
			// 	// 	if(status=='timeout'){
			// 	// 		callback(true,MSG_RETUIREDNETWORK);
			// 	// 	}
			// 	// },
			// 	// transformResponse:function(data, headersGetter, status){
			// 	// 	XMLHttpRequest.abort();
			// 	// 	if(textStatus !='timeout')
			// 	// 		callback(true,MSG_SYSTEMERROR);
			// 	// 	console.log(XMLHttpRequest, textStatus, errorThrown);
			// 	// }
			// }).
			// success(function(data,status){
			// 	callback(false,data);
			// }).
			// error(function(data,status,headers,config,statusText){
			// 	//XMLHttpRequest.abort();
			// 	if(statusText !='timeout')
			// 		callback(true,MSG_SYSTEMERROR);
			// 	else
			// 		callback(true,MSG_RETUIREDNETWORK);
			// })
		};
		this.checkRemoteAuthentication = function($http,requestData,callback){
			var self = this;
			var url = appConfig.remoteAddress+'/webservice.php?'+ decodeURIComponent($.param(requestData));
			$http({
				url:url,
				timeout:appConfig.timeout,
				type:'GET'
			}).
			success(function(result,status){

				/*
					result:
					{
						type:1
						response: 1 // 1 Authenticated , 2 Failed, 3 Error
						id: [uuid] 
						error:[error code]
					}
				*/
				
				switch(result.response){
                    case 1:
                    	AKHB.user.authcode = requestData.authcode;
                        AKHB.user.id = result.id;
                        self.captureAuthentication(AKHB.user);
                        callback(false,result);
                        break;
                    case 2:
                    	callback(true,{title:result.title, content : result.description});
                        break;
                    case 3:
                    	callback(true,{title:MSG_SYSTEMERROR.title,content : AKHB.utils.format(MSG_SYSTEMERROR.content,result.error)});
                        break;
                    default:
                    	callback(true,MSG_LOGINFAILED);
                        break;
                }


			}).
			error(function(data,status,headers,config,statusText){
				//XMLHttpRequest.abort();
				if(statusText !='timeout')
					callback(true,MSG_SYSTEMERROR);
				else
					callback(true,MSG_RETUIREDNETWORK);
				
			});
		};
	}
})();
