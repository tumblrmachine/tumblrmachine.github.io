/*
 * TumblrMachine: by Mike Kavouras
 *
 * Version: 0.4
 * Tumblr API Version: 2.0
*/


// TumblrMachine

function TumblrMachine(name, apiKey, fetch, onReady) {

  assert(name != null, "TumblrMachine: Please provide a blog name");
  assert(apiKey != null, "TumblrMachine: Please provide an API key");

  this._blogName = name;
  this._apiKey = apiKey;

  this._apiManager = new TumblrMachineAPIManager(name, apiKey);

  if (fetch) {
    this.getPosts(onReady, null);
  }
}

TumblrMachine.prototype = {
  getPosts: function(a, b, c) {

    // if no params
    if ( ! a) {
      this._apiManager.__fetchPosts();
    }

    // if params && isFunction
    else if (a && TumblrMachine.prototype.isFunction(a)) {
      this._apiManager.__fetchPosts(a, b);
    }

    else if (a && TumblrMachine.prototype.isNumber(a)) {
      // this.__fetchNumberOfPosts(a, b, c);
    }

  },

  nextPage: function(success, error) {
    if (this.hasMorePosts()) {
      console.error("TumblrMachine: No more posts.");
      if (success) {
        success(this._posts);
      }
    } else {
      this._apiManager.__fetchNextPageOfPosts(success, error);
    }
  },

  fetchAllPosts: function(success, error) {
    // TODO: unFINISHED
  },

  imageForPost: function(post) {
    if (TumblrMachine.prototype.isNumber(post)) {
      post = this._apiManager.__getPostById(postOrPostId);
    }

    if (typeof(post) === "undefined") {
      console.error("TumblrMachine: The post requested does not exist");
      return null;
    }

    return post.type === "photo" ? post.photos[0].original_size.url : post.thumbnail_url;
  },

  imagesForPosts: function(arg) {
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
  },

  postsForTag: function(t) {
    var posts = [];
    for (var i = 0; i < this._posts.length; i++) {
      var tags = this._apiManager.__tagsForPost(this._posts[i]);
      if (tags.indexOf(t) >= 0) {
        posts.push(this._posts[i]);
      }
    }
    return posts;
  },

  postsForTags: function(ts) {
    var posts = [];
    for (var i = 0; i < ts.length; i++) {
      var tag = ts[i].toLowerCase();
      posts = posts.concat(this.postsForTag(tag));
    }
    return posts;
  },

  hasMorePosts: function() {
    return this._posts.length === this._totalPostsCount;
  },

  posts: function() {
    return this._apiManager.__posts();
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


// API Manager

function TumblrMachineAPIManager(name, key) {
  this._limit = 100;
  this._posts = new TumblrPostsCollection();
  this._totalPostsCount = 0;
  this._apiKey = key;
  this._blogName = name;
}

TumblrMachineAPIManager.prototype = {
  __posts: function() {
    return this._posts._posts;
  },
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
      var posts = r.response.posts.map(function(post) { return new TumblrMachinePost(post); });
      self._posts.add(posts);
      self._totalPostsCount = r.response.total_posts;
      if (r.meta.status === 200) {
        if (success) {
          success(self._posts._posts);
        }
      } else {
        console.error("TumblrMachine: There was an error fetching posts.");
      }
    });
  },

  __addHelperMethodsToPosts: function(posts) {
    var self = this;
    for (var i = 0; i < posts.length; i++) {
      posts[i].imageHTML = function() {
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
    if ( ! this.__isFirstRequest()) {
      return this.__postsUrl();
    }
    return this.__postsUrl() + "&before_id=" + this._posts[this._posts.length - 1].id;
  },

  __haveAllPosts: function() {
    return this._posts.length === this._totalPostsCount;
  },

  __isFirstRequest: function() {
    return this._totalPostsCount > 0;
  }
}

// TumblrPost

function TumblrPostsCollection(posts) {
  this._posts = posts || [];
}

TumblrPostsCollection.prototype = {
  add: function(posts) {
    // add post(s) - make sure there aren't any dups
    this._posts = this._posts.concat(posts);
  },

  remove: function(post_or_postID) {
    // remove post
  }
}

function TumblrMachinePost(post) {
  this.blogName = post.blog_name;
  this.bookmarklet = post.bookmarklet;
  this.caption = post.caption;
  this.date = post.date;
  this.format = post.format;
  this.highlighted = post.highlighted;
  this.html5Capable = post.html5_capable;
  this.id = post.id;
  this.note_count = post.note_count;
  this.permalinkUrl = post.permalink_url;
  this.player = post.player;
  this.postUrl = post.postUrl;
  this.reblogKey = post.reblogKey;
  this.shortUrl = post.shortUrl;
  this.slug = post.slug;
  this.sourceTitle = post.source_title;
  this.sourceUrl = post.source_url;
  this.state = post.state;
  this.tags = post.tags;
  this.thumbnailHeight = post.thumbnail_height;
  this.thumbnailUrl = post.thumbnail_url;
  this.thumbnailWidth = post.thumbnail_width;
  this.timestamp = post.timestamp;
  this.type = post.type;
  this.videoType = post.video_type;
}

TumblrMachinePost.prototype = function(post) {
}

function assert(condition, message) {
  if ( ! condition) {
    throw message || "Illegal";
  }
}
