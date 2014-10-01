/*
 * TumblrMachine: by Mike Kavouras
 *
 * Version: 0.4
 * Tumblr API Version: 2.0
*/

function TumblrMachine(name, apiKey, fetch, onReady) {
  this._blogName = name;
  this._apiKey = apiKey;
  this._posts = [];
  this._limit = 100;
  this._totalPostsCount;

  this.fetchPosts = function(a, b, c) {

    // if no params
    if ( ! a) {
      this.__fetchPosts();
    }

    // if params && isFunction
    else if (a && TumblrMachine.prototype.isFunction(a)) {
      this.__fetchPosts(a, b);
    }

    else if (a && TumblrMachine.prototype.isNumber(a)) {
      // this.__fetchNumberOfPosts(a, b, c);
    }

  };

  this.fetchMorePosts = function(success, error) {
    if (this._posts.length === this._totalPostsCount) {
      console.error("TumblrMachine: No more posts.");
      if (success) {
        success(this._posts);
      }
    } else {
      this.__fetchNextPageOfPosts(success, error);
    }
  };

  this.fetchAllPosts = function(success, error) {
    // TODO: unFINISHED
  };

  this.imageForPost = function(post) {
    if (TumblrMachine.prototype.isNumber(post)) {
      post = this.__getPostById(postOrPostId);
    }

    if (typeof(post) === "undefined") {
      console.error("TumblrMachine: The post requested does not exist");
      return null;
    }

    return post.type === "photo" ? post.photos[0].original_size.url : post.thumbnail_url;
  };

  this.imagesForPosts = function(arg) {
    var posts = this._posts;
    var photos = [];

    if ( ! TumblrMachine.prototype.isNumber(arg) || ! TumblrMachine.prototype.isArray(arg)) {
      console.error("TumblrMachine: imagesForPosts - invalid argument");
      return;
    }

    if (TumblrMachine.prototype.isNumber(arg)) {
      posts = this._posts.slice(0, Math.min(arg, this._posts.length));
    } else if (TumblrMachine.prototype.isArray(arg)) {

      // empty array
      if ( ! arg.length) {
        return [];
      }

      var arr = arg;
      if (TumblrMachine.prototype.isNumber(arr[0]) && arr.length === 2) {
        posts = this._posts.slice(arr[0], Math.min(arr[1], this._posts.length));
      } else if (TumblrMachine.prototype.isObject(arr[0])) {
        posts = arr;
      } else {
        consle.error("TumblrMachine: imagesForPosts - invalid argument");
        return [];
      }
    }

    if ( ! posts.length) {
      return [];
    }

    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      photos.push(this.imageForPost(post));
    }

    return photos;
  };

  this.postsForTag = function(t) {
    var posts = [];
    for (var i = 0; i < this._posts.length; i++) {
      var tags = this.__tagsForPost(this._posts[i]);
      if (tags.indexOf(t) >= 0) {
        posts.push(this._posts[i]);
      }
    }
    return posts;
  };

  this.postsForTags = function(ts) {
    var posts = [];
    for (var i = 0; i < ts.length; i++) {
      var tag = ts[i].toLowerCase();
      posts = posts.concat(this.postsForTag(tag));
    }
    return posts;
  };

  if (fetch) {
    this.fetchPosts(onReady, null);
  }
}

TumblrMachine.prototype = {

  __getPostById: function(id) {
    var post;
    for (var i = 0; i < this._posts.length; i++) {
      if (this._posts[i].id === id) {
        post = this._posts[i];
        break;
      }
    }
    return post;
  },

  __fetchPosts: function(success, error) {
    this.__fetchPostsWithUrl(success, error, this.__postsUrl());
  },

  __fetchNextPageOfPosts: function(success, error) {
    this.__fetchPostsWithUrl(success, error, this.__nextPageUrl());
  },

  __fetchNumberOfPosts: function(n, success, error) {

  },

  __fetchAllPosts: function(success, error) {

  },

  __fetchPostsWithUrl: function(success, error, url) {
    var self = this;
    $.getJSON(url, function(r) {
      self.__addHelperMethodsToPosts(r.response.posts);
      self._posts = self._posts.concat(r.response.posts);
      self._totalPostsCount = r.response.total_posts;
      if (r.meta.status === 200) {
        if (success) {
          success(self._posts);
        }
      } else {
        console.error("TumblrMachine: There was an error fetching posts.");
      }
    });
  },

  __addHelperMethodsToPosts: function(posts) {
    var self = this;
    for (var i = 0; i < posts.length; i++) {
      posts[i].imageAsHTML = function() {
        var photo = self.imageForPost(this);
        return '<img src="'+ photo +'" />'
      }
    }
  },

  __tagsForPost: function(post) {
    return post.tags.map(function(tag) { return tag.toLowerCase(); });
  },

  __apiUrl: function() {
    return this.__urlRoot() + "/" + this.__apiVersion() + "/blog/" + this._blogName + ".tumblr.com";
  },

  __postsUrl: function() {
    return this.__apiUrl() + "/posts?api_key=" + this._apiKey + "&callback=?";
  },

  __apiVersion: function() {
    return "v2";
  },

  __urlRoot: function() {
    return "https://api.tumblr.com";
  },

  __nextPageUrl: function() {
    // make sure this isn't our first request
    if ( ! this._totalPostsCount) {
      return this.__postsUrl();
    }
    return this.__postsUrl() + "&before_id=" + this._posts[this._posts.length - 1].id;
  },

  __haveAllPosts: function() {
    return this._posts.length === this._totalPostsCount;
  }
}

// Convenience
TumblrMachine.prototype.isArray = function(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}
TumblrMachine.prototype.isObject = function(x) {
  return Object.prototype.toString.call(x) === "[object Object]";
}
TumblrMachine.prototype.isString = function(x) {
  return Object.prototype.toString.call(x) === "[object String]";
}
TumblrMachine.prototype.isNumber = function(x) {
  return Object.prototype.toString.call(x) === "[object Number]";
}
TumblrMachine.prototype.isFunction = function(x) {
  return Object.prototype.toString.call(x) === "[object Function]";
}
