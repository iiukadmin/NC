if (typeof(AKHB) == 'undefined') {
    AKHB = {};
}
if (typeof(AKHB.services) == 'undefined') {
    AKHB.services = {};
}

AKHB.services.db = (function() {
    return function(callback) {
        console.log("AKHB.services.db init inner.");
        try {
            persistence.schemaSync(function(tx) {
                if (typeof callback == "function") callback();
                console.log("Update schema success.");
            });
        } catch (ex) {
            console.log("Update schema failed.", ex);
            if (typeof callback == "function") callback();
        }
    }
})();

AKHB.services.db.prototype.getTableLastUpdateTime = function(tableName, callback) {

    var mSync = sync.all().filter('tableName', '=', tableName);
    mSync.one(null, function(result) {
        callback(false, result);
    });
};

AKHB.services.db.prototype.setTableLastUpdateTime = function(tx, tableName, lastUpdatetime, callback) {
    this.getTableLastUpdateTime(tableName, function(err, result) {
        if (!result) {
            var _sync = new sync({
                tableName: tableName,
                lastUpdatetime: lastUpdatetime
            });
            persistence.add(_sync);
        } else {
            result.lastUpdatetime = lastUpdatetime;
        }
        callback(false);
    });
};


AKHB.services.db.prototype.getArticleById = function(id, callback) {
    var mArticles = article.all().filter('server_id', '=', id);
    mArticles.one(null, function(article) {
        callback(false, article);
    })
};

AKHB.services.db.prototype.getHomeArticle = function(callback) {
    var mArticles = article.all().filter('type', '=', '3');
    mArticles.list(null, function(articles) {
        var count = articles.length;
        if (count == 0) {
            callback(false, null);
        } else if (count == 1) {
            callback(false, articles[0]);
        } else {
            var index = Math.floor(Math.random() * count);
            callback(false, articles[index]);
        }

    })
};

AKHB.services.db.prototype.setArticle = function(tx, _article, callback) {
    this.getArticleById(_article.id, function(err, resultArticle) {
        if (!resultArticle) {
            var _mArticle = new article({
                server_id: _article.id,
                title: _article.title,
                content: _article.content.replace(/\\\"/ig, "\""),
                last_modified: moment(_article.last_modified).toDate(), //_article.last_modified,
                type: _article.type,
                status: _article.status,
                is_read: 0
            });
            persistence.add(_mArticle);
        } else {
            if (_article.status == 1) {
                persistence.remove(resultArticle);
            } else {
                resultArticle.title = _article.title;
                resultArticle.content = _article.content.replace(/\\\"/ig, "\"");
                resultArticle.last_modified = moment(_article.last_modified).toDate();
                resultArticle.type = _article.type;
                resultArticle.status = _article.status;
                resultArticle.is_read = 0;
            }
        }
        callback(false);

    });
};


AKHB.services.db.prototype.getMessageById = function(id, callback) {
    var mMessages = message.all().filter('server_id', '=', id);
    mMessages.one(null, function(_message) {
        callback(false, _message);
    })
};

AKHB.services.db.prototype.setMessage = function(tx, _message, callback) {
    this.getMessageById(_message.id, function(err, resultMessage) {
        if (!resultMessage) {
            var _mMessage = new message({
                server_id: _message.id,
                title: _message.title,
                content: _message.content.replace(/\\\"/ig, "\""),
                last_modified: moment(_message.last_modified).toDate(),
                type: _message.type,
                status: _message.status
            });
            persistence.add(_mMessage);
        } else {
            if (_message.status == 1) {
                persistence.remove(resultMessage);
            } else {
                resultMessage.title = _message.title;
                resultMessage.content = _message.content.replace(/\\\"/ig, "\"");
                resultMessage.last_modified = moment(_message.last_modified).toDate();
                //console.log("_message",_message.last_modified,_message);
                resultMessage.type = _message.type;
                resultMessage.status = _message.status;
            }
        }
        callback(false);
    });
};


AKHB.services.db.prototype.getNavigationById = function(id, callback) {
    var mNavigations = navigation.all().filter('server_id', '=', id);
    mNavigations.one(null, function(navigation) {
        callback(false, navigation);
    })
};
AKHB.services.db.prototype.hasNavigationChildren = function(id, callback) {
    var mNavigations = navigation.all().filter('parent_id', '=', id);
    mNavigations.and(new persistence.PropertyFilter('status', '=', '0'))
        .one(null, function(navigation) {
            callback(false, navigation);
        })
};
AKHB.services.db.prototype.setNavigation = function(tx, _navigation, callback) {
    this.getNavigationById(_navigation.id, function(err, resultNavigation) {
        if (!resultNavigation) {
            var _mNavigation = new navigation({
                server_id: _navigation.id,
                title: _navigation.title,
                parent_id: _navigation.parent_id,
                order_by: _navigation.order_by,
                content: _navigation.content,
                link: _navigation.link,
                last_modified: moment(_navigation.last_modified).toDate(), //_navigation.last_modified,
                type: _navigation.type,
                status: _navigation.status,
                icon: _navigation.icon,
                home_page: _navigation.home_page
            });
            persistence.add(_mNavigation);
        } else {
            if (_navigation.status == 1) {
                persistence.remove(resultNavigation);
            } else {
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
                resultNavigation.home_page = _navigation.home_page;
            }
        }
        callback(false);
    });
};

AKHB.services.db.prototype.getCommitteById = function(id, callback) {
    var mCommitte = committees.all().filter('server_id', '=', id);
    mCommitte.one(null, function(committe) {
        callback(false, committe);
    })
};

AKHB.services.db.prototype.setCommitte = function(tx, _committe, remoteAddress, callback) {
    var that = this;
    var dbCommitte = null;
    var isPullData = false;
    this.getCommitteById(_committe.id, function(err, resultCommitte) {
        if (!resultCommitte) {
            dbCommitte = new committees({
                server_id: _committe.id,
                inst_type: _committe.inst_type,
                category: _committe.category,
                title: _committe.title,
                description: _committe.description,
                email: _committe.email,
                status: _committe.status,
                is_show: 1,
                last_modified: moment(_committe.last_modified).toDate(),
                last_changed: moment(_committe.last_changed).toDate()
            });
            isPullData = true;
            persistence.add(dbCommitte);
        } else {
            if (_committe.status == 1) {
                that.clearCommitteePersons(resultCommitte.server_id);
                persistence.remove(resultCommitte);
            } else {

                dbCommitte = resultCommitte;

                var now = moment(_committe.last_changed);
                var then = moment(dbCommitte.last_changed);

                if (_committe.last_changed && then.diff(now, 'days') >= 0) {
                    isPullData = true;
                    // console.log(moment(_committe.last_changed) > dbCommitte.last_modified,moment(_committe.last_changed) , dbCommitte.last_modified);
                    // isPullData = moment(_committe.last_changed) > dbCommitte.last_modified;
                    // if(isPullData){


                    dbCommitte.title = _committe.title;
                    dbCommitte.last_modified = moment(_committe.last_modified).toDate();
                    dbCommitte.inst_type = _committe.inst_type;
                    dbCommitte.status = _committe.status;
                    dbCommitte.category = _committe.category;
                    dbCommitte.description = _committe.description;
                    dbCommitte.email = _committe.email;
                    dbCommitte.last_changed = moment(_committe.last_changed);
                }
            }
        }
        persistence.flush(function() {
            if (isPullData) {
                that.setDirectories(dbCommitte, _committe.last_content_synced, remoteAddress);
            }
            callback(err);
        });

    });
};


AKHB.services.db.prototype.getNavigationsByParentId = function(id, callback) {
    var mNavigations = navigation.all();
    mNavigations.filter('parent_id', '=', id)
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .order('order_by', true)
        .order('last_modified', false)
        .list(null, function(messages) {
            callback(false, messages);
        });
};

AKHB.services.db.prototype.getHomepageIcons = function(callback) {
    var mNavigations = navigation.all();
    mNavigations.filter('home_page', '=', 1)
    mNavigations.filter('parent_id', '=', 0)
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .order('order_by', true)
        .order('last_modified', false)
        .list(null, function(navigations) {
            callback(false, navigations);
        });
};

AKHB.services.db.prototype.getMessages = function(callback) {
    var mMessages = message.all();
    mMessages.filter('status', '<', '2')
        .order('type', true)
        .order('server_id', false)
        .list(null, function(messages) {
            callback(false, messages);
        });
};
AKHB.services.db.prototype.getMessageCount = function(callback) {
    var mMessages = message.all();
    mMessages.filter('status', '<', '2')
        .count(null, function(count) {
            callback(false, count);
        });
};
AKHB.services.db.prototype.getUnreadMessageCount = function(callback) {
    var mMessages = message.all();
    mMessages.filter('status', '=', '0')
        .count(null, function(count) {
            callback(false, count);
        });
};


AKHB.services.db.prototype.getActiveMessageCount = function(callback) {
    var mMessages = message.all();
    mMessages.filter('type', '=', '2')
        .and(new persistence.PropertyFilter('read', '=', '0'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .count(null, function(count) {
            callback(false, count);
        });
};

AKHB.services.db.prototype.getLatestActiveMessage = function(callback) {
    var mMessages = message.all()
        .filter('type', '=', '2')
        .and(new persistence.PropertyFilter('read', '=', '0'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .order('server_id', false);
    mMessages.one(null, function(message) {
        callback(false, message);
    })
};
AKHB.services.db.prototype.deleteMessage = function(id, callback) {
    var mMessages = message.all().filter('server_id', '=', id);
    mMessages.one(null, function(message) {
        message.status = 2;
        persistence.flush(function() {
            callback(false, message);
        });
    })
};

AKHB.services.db.prototype.setMessageUsed = function(id, callback) {
    var mMessages = message.all().filter('server_id', '=', id);
    mMessages.one(null, function(message) {
        message.type = 2;
        persistence.flush(function() {
            callback(false, message);
        });
    })
};

AKHB.services.db.prototype.setUsage = function(id, type, status, callback) {
    var _usage = new usage({
        status: status,
        content_id: parseInt(id),
        type: type,
        date_time: new Date()
    });
    persistence.add(_usage);
    if (typeof callback == "function") callback();
};




AKHB.services.db.prototype.getUsage = function(type, callback) {
    var usages = usage.all().filter('status', '=', type).limit(30);
    usages.list(function(data) {
        callback(null, data);
    })
};

AKHB.services.db.prototype.getDirectoryById = function(id, callback) {
    var directories = directory.all().filter('server_id', '=', id);
    directories.one(function(data) {
        callback(null, data);
    })
};

AKHB.services.db.prototype.getCommitteById = function(id, callback) {
    var directories = committees.all().filter('server_id', '=', id);
    directories.one(function(data) {
        callback(null, data);
    })
};


AKHB.services.db.prototype.getDirectoryCategories = function(callback) {
    persistence.transaction(function(tx) {
        tx.executeSql('select inst_type as id ,category as title from committees group by inst_type,category ;',
            null,
            function(data) {
                callback(null, data);
            },
            function(err) {
                console.log(err);
            });
    })
};


AKHB.services.db.prototype.clearCommitteePersons = function(committe_id, callback) {
    persistence.transaction(function(tx) {
        tx.executeSql('DELETE FROM committee_persons_link WHERE committe_id = ?', [committe_id],
            function(data) {
                if (typeof callback == 'function') {
                    callback(null, data);
                }
            },
            function(err) {
                console.log(err);
            });
    })
};


AKHB.services.db.prototype.setDirectoryCategories = function(model, remoteAddress, last_content_synced, callback) {
    var that = this;
    var _category = category.all().filter('type', '=', model.type);
    _category.one(function(dbCategory) {
        if (dbCategory == null) {
            var _directoryCategory = new category({
                type: model.type,
                title: model.title,
                status: model.status
            });
            persistence.add(_directoryCategory);
            that.setDirectories(model, last_content_synced, _directoryCategory, remoteAddress, callback);

        } else {
            if (model.last_modified > dbCategory.last_modified) {
                dbCategory.last_modified = model.last_modified;
                dbCategory.title = model.title;
                dbCategory.status = model.status;
                that.setDirectories(model, last_content_synced, dbCategory, remoteAddress, callback);
            } else {
                callback(null);
            }
        }
    })
}
AKHB.services.db.prototype.syncLatestTask = function(callback) {
    var that = this;
    var tasks = syncTask.all()
        .filter('status', '=', 0)
        .order('last_modified', true)
        .order('committe_id', true)
        .limit(5);
    if (!AKHB.services.xhr) {
        AKHB.services.xhr = [];
    }

    tasks.list(function(data) {
        // callback(null,data);
        if (data.length == 0) {
            persistence.transaction(function(tx) {
                tx.executeSql('DELETE FROM persons WHERE server_id not in ( SELECT person_id FROM committee_persons_link)', [],
                    function(result) {
                        callback(null);
                    },
                    function(err) {
                        callback(err);
                    });
            })
            return;
        }
        var clearCommittee = function(committe_id, callback) {
            async.waterfall([
                function(callback) {
                    committees.all().filter('server_id', '=', committe_id)
                        .one(function(data) {
                            callback(null, data);
                        })
                },
                function(committee, callback) {
                    if (!committee) {
                        callback(null, null);
                        return;
                    }
                    persistence.transaction(function(tx) {
                        tx.executeSql('DELETE FROM committee_persons_link WHERE committe_id = ?;', [committee.server_id],
                            function(result) {
                                console.log('Delete committee_persons_link', result, committee.server_id);
                                callback(null, committee);
                            },
                            function(err) {
                                console.log('Delete committee_persons_link err', err);
                                callback(err, committee);
                            });
                    })
                },
                function(committee, callback) {
                    if (!committee) {
                        callback(null, null);
                        return;
                    }
                    persistence.transaction(function(tx) {
                        tx.executeSql('DELETE FROM persons WHERE server_id not in ( SELECT person_id FROM committee_persons_link)', [],
                            function(result) {
                                console.log('Delete persons', result);
                                callback(null);
                            },
                            function(err) {
                                console.log('Delete persons err', err);
                                callback(err);
                            });
                    });
                }
            ], function(err) {
                callback(err);
            });
        }

        async.each(data, function(item, callback) {
            if (item.committe_status == 1) {
                console.log(1);
                async.waterfall([
                    function(callback) {
                        committees.all()
                            .filter('server_id', '=', item.committe_id)
                            .one(function(entity) {
                                if (entity) {
                                    persistence.remove(entity);
                                }
                                callback();
                            })
                    },
                    function(callback) {
                        committeeContents.all()
                            .filter('server_id', '=', item.committe_id)
                            .one(function(entity) {
                                if (entity) {
                                    persistence.remove(entity);
                                }
                                callback();
                            })
                    },
                    function(callback) {
                        committeePersons.all()
                            .filter('committe_id', '=', item.committe_id)
                            .list(function(links) {
                                if (links) {
                                    //persistence.remove(links);
                                }
                                callback();
                            })
                    }
                ], function(err) {
                    persistence.remove(item);
                    clearCommittee(item.committe_id, callback);
                })
                return;
            }
            //debugger
            var url = AKHB.config.remoteAddress + '?type=2&table=directory';
            url += '&id=' + item.committe_id;
            url += '&inst_type=' + item.inst_type;
            url += '&uuid=' + AKHB.user.id;
            url += '&os=' + AKHB.user.os;
            url += '&version=' + AKHB.user.appVersion;
            url += '&last_content_synced=' + moment(item.last_modified).format("YYYY-MM-DD");

            var directories = committees.all()
                .filter('server_id', '=', item.committe_id)

            var xhr = $.ajax({
                url: url,
                type: 'GET',
                success: function(data) {
                    try {
                        data = JSON.parse(data);
                    } catch (ex) {
                        console.log(ex);
                        callback(null);
                        return;
                    }
                    if (data.content) {
                        var content = JSON.stringify(data.content);
                        async.waterfall([

                            function(callback) {
                                persistence.transaction(function(tx) {
                                    tx.executeSql('DELETE FROM committee_persons_link WHERE committe_id = ?;', [item.committe_id],
                                        function(result) {
                                            callback(null);
                                        },
                                        function(err) {
                                            callback(err);
                                        });
                                })

                            },
                            function(callback) {
                                var _committeeContent = committeeContents.all().filter('server_id', '=', item.committe_id);
                                _committeeContent.one(function(data) {

                                    if (data) {
                                        data.content = content;
                                    } else {
                                        data = new committeeContents({
                                            server_id: item.committe_id,
                                            content: content
                                        });
                                        persistence.add(data);
                                    }
                                    callback(null, data);
                                });
                            },
                            function(committeeContent, callback) {
                                async.each(data.content, function(role, contentCallback) {
                                    async.each(role.names, function(name, nameCallback) {
                                        name.committees = JSON.stringify(name.committees);
                                        name.name = name.forename + ' ' + name.Surname;
                                        var result = persons.all();
                                        result = result.and(new persistence.PropertyFilter('server_id', '=', name.ID));
                                        result.one(function(dbPerson) {
                                            if (!dbPerson) {
                                                name.server_id = name.ID;
                                                persistence.add(new persons(name));

                                            } else {
                                                var now = moment(name.last_modified);
                                                var then = moment(dbPerson.last_modified);

                                                if (name.last_modified && then.diff(now, 'days') >= 0) {
                                                    dbPerson.server_id = name.ID;
                                                    dbPerson.Surname = name.Surname;
                                                    dbPerson.forename = name.forename;
                                                    dbPerson.home_number = name.home_number;
                                                    dbPerson.mobile = name.mobile;
                                                    dbPerson.title = name.title;
                                                    dbPerson.name = name.name;
                                                    dbPerson.last_modified = name.last_modified;
                                                }
                                            }
                                            persistence.add(new committeePersons({
                                                committe_id: item.committe_id,
                                                person_id: name.ID
                                            }));
                                            nameCallback(null);
                                        })

                                    }, function(err) {
                                        contentCallback(null);
                                    })
                                }, function(err) {
                                    callback(err);
                                });
                            }
                        ], function(err) {
                            callback(err);
                        })
                    } else {
                        clearCommittee(item.committe_id, callback)
                    }
                },
                error: function() {
                    callback(null);
                }
            })
            AKHB.services.xhr.push(xhr);
            persistence.remove(item);
        }, function(err) {
            persistence.flush(function() {
                callback();
            })

        })
    })

}
AKHB.services.db.prototype.setDirectories = function(model, last_modified, remoteAddress) {
    var that = this;

    var tasks = syncTask.all()
        .filter('last_modified', '=', last_modified)
        .and(new persistence.PropertyFilter('committe_id', '=', model.server_id))
        //console.log("setDirectories",model.server_id,last_modified);
    tasks.count(function(num) {
        if (num == 0) {
            var _task = new syncTask({
                committe_id: model.server_id,
                status: 0,
                inst_type: model.inst_type,
                last_modified: last_modified,
                committe_status: model.status
            });
            persistence.add(_task);
        }
    });




    // setTimeout(function(){
    //  $.get(url,function(data){
    //      try{
    //          data = JSON.parse(data);
    //      }catch(ex){
    //          console.log(ex);
    //          return;
    //      }
    //      if(data.content) {

    //          model.content = JSON.stringify(data.content);
    //          model.is_show = 1;
    //          async.each(data.content,function(data,callback){
    //              for(var person in data.names){
    //                  person = data.names[person];
    //                  persistence.add(new persons({
    //                      committe_id: model.server_id,
    //                      name:$.trim(person.forename)+' '+$.trim(person.Surname),
    //                      content:person
    //                  }));
    //              }
    //          });
    //      }
    //  })

    // },200);

};
AKHB.services.db.prototype.setDirectory = function(model, id, callback) {

    this.getDirectoryById(model.id, function(err, localModel) {
        if (err || !localModel) {
            var _directory = new directory({
                server_id: model.id,
                type: model.type,
                title: model.title,
                description: model.description,
                email: model.email,
                members: model.members,
                status: model.status,
                last_modified: model.last_modified,
                category_id: id
            });
            persistence.add(_directory);
        } else {
            if (model.status == 1) {
                persistence.remove(localModel);
            } else {
                localModel.server_id = model.id;
                localModel.type = model.type;
                localModel.title = model.title;
                localModel.description = model.description;
                localModel.email = model.email;
                localModel.members = model.members;
                localModel.status = model.status;
                localModel.last_modified = model.last_modified;
                localModel.category_id = id;
            }
        }
        callback(null);
    });
};

AKHB.services.db.prototype.getDirectories = function(type, callback) {
    var directories = committees.all()
        .filter('inst_type', '=', type)
        .and(new persistence.PropertyFilter('is_show', '=', '1'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .limit(30);
    directories.list(function(data) {
        callback(null, data);
    })
};
AKHB.services.db.prototype.getOneDirectory = function(category, index, callback) {
    var directories = committees.all()
        .filter('inst_type', '=', category)
        .and(new persistence.PropertyFilter('is_show', '=', '1'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .order('title', true).limit(1).skip((index - 1) * 1);
    directories.list(function(data) {
        callback(null, data);
    })
};
AKHB.services.db.prototype.getDirectoriesPagnation = function(category, index, pageSize, callback) {
    var directories = committees.all()
        .filter('inst_type', '=', category)
        .and(new persistence.PropertyFilter('is_show', '=', '1'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        .order('title', true).limit(pageSize).skip((index - 1) * pageSize);
    directories.list(function(data) {
        callback(null, data);
    })
};

AKHB.services.db.prototype.searchPersons = function(key, callback) {

    var _persons = persons.all()
        .filter('name', 'like', '%' + key + '%')
        //.and(new persistence.PropertyFilter('status','=','0'))
        //.and(new persistence.PropertyFilter('is_show','=','1'))
        //.or(new persistence.PropertyFilter('title','like','%'+key+'%'))
        .order('name', true).limit(20);
    _persons.list(function(data) {
        callback(null, data);
    })
};

AKHB.services.db.prototype.searchCommittees = function(key, callback) {
    var directories = committees.all()
        .filter('title', 'like', '%' + key + '%')
        .and(new persistence.PropertyFilter('is_show', '=', '1'))
        .and(new persistence.PropertyFilter('status', '=', '0'))
        //.or(new persistence.PropertyFilter('title','like','%'+key+'%'))
        .order('title', true).limit(20);
    directories.list(function(data) {
        callback(null, data);
    })
};
AKHB.services.db.prototype.getCommitteContentById = function(id, callback) {
    var content = committeeContents.all().filter('server_id', '=', id);
    content.one(function(data) {
        callback(null, data);
    })
};


// persistence.transaction(function(tx){
//  key = key.replace(/'/g,'\\\'');
//  tx.executeSql('select id from committees where title like \'%'+key+'%\' or content like \'%'+key+'%\' order by title asc limit 20 ;',
//      null,
//      function(data){
//          console.log(data);
//          callback(null,data);
//      },
//      function(err){
//          console.log(err);
//      });
// })

AKHB.services.db.prototype.getDirectoriesCount = function(category, callback) {
    var directories = committees.all()
        .filter('inst_type', '=', category)
        .and(new persistence.PropertyFilter('is_show', '=', '1'))
        .and(new persistence.PropertyFilter('status', '=', '0'));
    directories.count(function(count) {
        callback(null, count);
    })
};


AKHB.services.db.prototype.getNavigations = function(callback) {
    var mNavigations = navigation.all();
    mNavigations.filter('status', '=', '0')
        .order('parent_id', false)
        .order('order_by', true)
        .list(null, function(navigations) {

            var jsonNavigations = new Array();
            async.each(navigations, function(nav, cb) {
                nav.selectJSON(null, ['*'], function(jsonResult) {
                    jsonNavigations.push(jsonResult);
                    cb(null);
                })
            }, function(err) {
                var getNavigationsByParentId = function(parentId) {
                    var mNavArray = new Array();
                    for (var nav in jsonNavigations) {
                        if (parentId == jsonNavigations[nav].parent_id) {
                            mNavArray.push(jsonNavigations[nav])
                        }
                    }
                    return mNavArray;
                }
                if (typeof callback == 'function') {
                    for (var nav in jsonNavigations) {
                        var childNavs = getNavigationsByParentId(jsonNavigations[nav].server_id);
                        if (childNavs.length > 0) {
                            jsonNavigations[nav].children = childNavs;
                        }
                    }
                    var newJsonNavigations = new Array();
                    for (var nav in jsonNavigations) {
                        if (jsonNavigations[nav].parent_id == 0) {
                            newJsonNavigations.push(jsonNavigations[nav]);
                        }
                    }
                    callback(null, newJsonNavigations);
                }

            });

        });
};

AKHB.services.db.prototype.addUserMedication = function(medication, item, callback) {

    var user_medication = new userMedications({
        drug_name: item.drug_name,
        directions: item.directions,
        status: 0,
        last_amend_date: new Date()
    });
    user_medication.server_id = user_medication.id;
    user_medication.ServerMedication = medication;
    persistence.add(user_medication);
    persistence.flush(callback);
};


AKHB.services.db.prototype.addNewUserMedication = function(med, callback) {
    var medicine = new medications({
        server_id: 0,
        name: med.drug_name,
        is_local: true,
        last_modified: new Date()
    });

    persistence.add(medicine);
    var user_medication = new userMedications({
        drug_name: med.drug_name,
        directions: med.directions,
        status: 0,
        last_amend_date: new Date()
    });
    user_medication.server_id = user_medication.id;
    user_medication.ServerMedication = medicine;
    persistence.add(user_medication);
    persistence.flush(callback);
};


AKHB.services.db.prototype.getUserMedications = function(callback) {
    userMedications.all().filter('status', '=', 0).list(function(data) {
        callback(data);
    });
};

AKHB.services.db.prototype.addReminder = function(medications, reminder, callback) {
    var schedules = AKHB.utils.generateSchedules(reminder);
    this.getMaxRowIndex("Reminders", function(index) {
        reminder.notification_id = index;

        AKHB.utils.addLocalNotification(reminder);

        angular.forEach(schedules, function(item, index, arr) {
            reminder.schedules.add(item);
        });
        angular.forEach(medications, function(item, index, arr) {
            reminder.userMedications.add(item);
        });

        persistence.add(reminder);
        persistence.flush(callback);
    });

};

AKHB.services.db.prototype.deleteReminder = function(reminder, callback) {

    reminder.status = 1;

    if (reminder.notification_id) {
        cordova.plugins.notification.local.getAllIds(function(ids) {
                removeNotificationIds = $.grep(ids, function(idItem) {
                    return (idItem >= reminder.notification_id * 100) && (idItem <= reminder.notification_id * 100 + 99)
                });
                console.log("removed notification ids ", removeNotificationIds);
                cordova.plugins.notification.local.cancel(removeNotificationIds);
            })
            // cordova.plugins.notification.local.clear(reminder.notification_id, function() {});
        async.waterfall([
                function(callback) {
                    reminder.schedules.destroyAll(null, function(err) {
                        callback(null);
                    });
                },
                function(callback) {
                    //reminder.medications.destroyAll(null, function(err) {
                    persistence.transaction(function(tx) {
                        console.log('DELETE Relation:', 'deleteReminder', reminder.id);
                        tx.executeSql("DELETE FROM `reminders_userMedications_userMedications` WHERE `reminders_userMedications` = ?", [reminder.id],
                            function(results) {
                                callback(null);
                            });
                    })

                }
            ],
            function(err) {

                persistence.flush(null, function() {
                    callback();
                });
            });
    }
};

AKHB.services.db.prototype.updateReminder = function(medications, reminder, callback) {

    async.waterfall([
            function(callback) {
                reminder.schedules.destroyAll(null, function(err) {
                    callback(null);
                });
            },
            function(callback) {
                //reminder.medications.destroyAll(null, function(err) {
                persistence.transaction(function(tx) {
                    console.log('DELETE Relation:', 'updateReminder', reminder.id);
                    tx.executeSql("DELETE FROM `reminders_userMedications_userMedications` WHERE `reminders_userMedications` = ?", [reminder.id],
                        function(results) {
                            callback(null);
                        });
                })

            }
        ],
        function(err) {
            var schedules = AKHB.utils.generateSchedules(reminder);

            if (schedules.length > 0) {
                AKHB.utils.addLocalNotification(reminder);
            }


            angular.forEach(medications, function(item, index, arr) {
                reminder.userMedications.add(item);
            });

            angular.forEach(schedules, function(item, index, arr) {
                reminder.schedules.add(item);

            });

            persistence.flush(null, function() {
                callback();
            });
        });




};
AKHB.services.db.prototype.clearSchedules = function(callback) {
    persistence.transaction(function(tx) {
        tx.executeSql('DELETE FROM schedules WHERE triggered = 0 ;', null,
            function(result) {
                callback(null);
            },
            function(err) {
                callback(err);
            });
    })
}

AKHB.services.db.prototype.getTodaySchedules = function(callback) {
    var today = moment().hours(0).minutes(0).seconds(0);
    persistence.transaction(function(tx) {
        async.waterfall([
            function(callback) {
                schedules.all()
                    .filter('trigger_at', '>', moment().startOf('day').toDate())
                    .and(new persistence.PropertyFilter('trigger_at', '<', moment().endOf('day').toDate()))
                    .list(null, function(list) {
                        callback(null, list);
                    })
            },
            function(list, callback) {
                async.each(list, function(item, callback) {
                    item.fetch("reminder", function(data) {
                        item.reminder.userMedications.list(null, function(lists) {
                            item.medications = lists;
                            callback(null);
                        })
                    })
                }, function(err) {
                    callback(null, list);
                })
            }
        ], function(err, list) {
            callback(list);

        });
    });
};


AKHB.services.db.prototype.getReminders = function(callback) {
    reminders.all().filter('status', '=', 0).list(function(data) {
        callback(data);
    });
};
AKHB.services.db.prototype.getReminder = function(id, callback) {
    reminders.load(id, function(reminder) {
        callback(reminder);
    });
};
AKHB.services.db.prototype.getMaxRowIndex = function(tableName, callback) {
    tableRowIndex.all().filter("tableName", "=", tableName).order("index", false).one(function(data) {
        var index = 1;
        if (data) {
            data.index++;
            index = data.index;
        } else {
            persistence.add(new tableRowIndex({
                tableName: tableName,
                index: 1,
            }));
            callback(1);
        }
        callback(index);

    });
};


AKHB.services.db.prototype.clear = function(callback) {
    persistence.reset(null, function() {
        persistence.schemaSync(function() {
            if (typeof callback == 'function') callback();
        });
    });
};

AKHB.services.db.prototype.getMedicineById = function(id, callback) {
    medications.all().filter("server_id", "=", id).one(function(result) {
        callback(null, result);
    })
}

AKHB.services.db.prototype.setUserMedicine = function(medicine, callback) {
    userMedications.all().filter("server_id", "=", medicine.ID).one(function(resultMedicine) {
        var rmds = [];
        async.waterfall([
            function(callback) {
                if (resultMedicine) {
                    resultMedicine.reminders.list(null, function(data) {
                        rmds = data;
                        persistence.remove(resultMedicine);
                        callback();
                    })
                } else {
                    callback();
                }
            }
        ], function(err) {
            var md = new userMedications({
                server_id: medicine.ID,
                med_id: medicine.Med_ID,
                drug_name: medicine.Drug_Name,
                directions: medicine.Directions,
                is_local: false,
                status: medicine.Status,
                last_amend_date: moment(medicine.Last_amend_date).toDate()
            });
            angular.forEach(rmds, function(med) {
                md.reminders.add(med);
            });
            medications.all().filter("server_id", "=", medicine.Med_ID).one(function(result) {
                if (result) md.ServerMedication = result;
                persistence.add(md);
                callback(null, result);
            })
        })
    });
}

AKHB.services.db.prototype.setMedicine = function(medicine, callback) {
    this.getMedicineById(medicine.ID, function(err, resultMedicine) {
        if (!resultMedicine) {
            var md = new medications({
                server_id: medicine.ID,
                name: medicine.Medication,
                status: medicine.Status,
                last_modified: moment(medicine.Last_amend_date).toDate()
            });
            persistence.add(md);
        } else {
            if (resultMedicine.status == 1) {
                persistence.remove(resultMedicine);
            } else {
                resultMedicine.name = medicine.Medication;
                //resultNnavigation.content(_navigation.content);
                resultMedicine.last_modified = moment(medicine.Last_amend_date).toDate();
                resultMedicine.status = medicine.Status;

            }
        }
        callback(false);
    });
}


AKHB.services.db.prototype.setReminder = function(reminder, callback) {
    reminders.all().filter("server_id", "=", reminder.ID).one(function(resultMedicine) {
        if (resultMedicine) {
            persistence.remove(resultMedicine);
        };

        var md = new reminders({
            id: reminder.ID,
            days: JSON.stringify(reminder.Days),
            type: reminder.Type,
            skip_for: reminder.Skip_For,
            is_blank_end: reminder.is_blank_end,
            start_date: reminder.Start_Date,
            end_date: reminder.End_Date,
            remind_for: reminder.Remind_For,
            reminder_time: reminder.Reminder_Time,
            status: reminder.Status,
            last_amend_date: reminder.Last_amend_date,
        });



        userMedications.all().filter('server_id', 'in', reminder.Medication)
            .list(function(result) {
                angular.forEach(result, function(item, index) {
                    md.userMedications.add(item);
                });

                if (typeof cordova == undefined) {
                    persistence.add(md);
                    callback(false);
                } else {

                    cordova.plugins.notification.local.getIds(function(ids) {
                        var notification_id = 1;
                        while (ids.indexOf(notification_id) > -1) {
                            notification_id++;
                        }
                        md.notification_id = notification_id;

                        persistence.add(md);
                        callback(false);
                    });

                }

            });

    });
}

AKHB.services.db.prototype.getUploadReminders = function(lastSyncTime, callback) {
    reminders.all().filter('last_amend_date', '>', lastSyncTime).list(function(data) {
        async.each(data, function(item, callback) {
            item.medication = [];
            item.userMedications.list(function(data) {
                async.each(data, function(med, callback) {
                    var ids = {};
                    ids.local = med.id;
                    med.fetch('ServerMedication', function() {
                        ids.server = med.ServerMedication.server_id;

                        if (ids.local == ids.server) {
                            ids.server = '';
                        }
                        item.medication.push(ids);
                        callback();
                    })

                }, function(err) {
                    callback();
                })

            })
        }, function(err) {
            callback(null, data);
        });

    })
}

AKHB.services.db.prototype.getUploadUserMedicines = function(lastSyncTime, callback) {
    userMedications.all()
        .prefetch('ServerMedication')
        .filter('last_amend_date', '>', lastSyncTime).list(function(data) {
            callback(null, data);
        })
}