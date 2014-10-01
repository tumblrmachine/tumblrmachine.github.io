/*
 * TumblrMachine: by Mike Kavouras
 *
 * Version: 0.4
 * Tumblr API Version: 2.0
*/

// TumblrMachine

function TumblrMachine(name, apiKey, preventFetch, onReady) {

  assert(name != null, "TumblrMachine: Please provide a blog name");
  assert(apiKey != null, "TumblrMachine: Please provide an API key");

  this.posts = [];
  this._blogName = name;
  this._apiKey = apiKey;
  this._firstFetch = true;

  var self = this;
  this._apiManager = new TumblrMachineAPIManager(name, apiKey);
  this._apiManager.bind('fetched', function() {
    self._firstFetched = false;
  });

  this._setupObservers();

  if (preventFetch !== true) {
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

  getNextPage: function(success, error) {
    if (! this.hasMorePosts() && ! this._firstFetch) {
      console.error("TumblrMachine: No more posts.");
      if (success) {
        success(this.posts);
      }
    } else {
      this._apiManager.__fetchNextPageOfPosts(success, error);
    }
  },

  getAllPosts: function(success, error) {
    var self = this;
    var firstTime = true;
    var block = function() {
      if (firstTime || self.hasMorePosts()) {
        firstTime = false;
        self._apiManager.__fetchNextPageOfPosts(block, error);
      } else {
        if (success) {
          success(self.posts);
        }
      }
    }
    block();
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
    for (var i = 0; i < this.posts.length; i++) {
      var tags = this._apiManager.__tagsForPost(this.posts[i]);
      if (tags.indexOf(t) >= 0) {
        posts.push(this.posts[i]);
      }
    }
    return posts;
  },

  postsForTags: function() {
    var posts = [];
    for (var i = 0; i < arguments.length; i++) {
      var tag = arguments[i].toLowerCase();
      posts = posts.concat(this.postsForTag(tag));
    }
    return posts;
  },

  hasMorePosts: function() {
    return this.posts.length !== this._apiManager._totalPostsCount;
  },

  _setupObservers: function() {
    var self = this;
    Object.observe(this._apiManager._posts, function(change) {
      for (var i = 0; i < change.length; i++) {
        if (change[i].name === "_posts" && change[i].type === "update") {
          self.posts = change[i].object._posts;
        }
      }
    });
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
  this._perPage = 20;
  this._posts = new TumblrMachinePostsCollection();
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
      self.trigger('fetched');
      var posts = self.__processPostsFromResponse(r)
      if (r.meta.status === 200) {
        if (success) {
          success(posts);
        }
      } else {
        console.error("TumblrMachine: There was an error fetching posts.");
      }
    });
  },

  __processPostsFromResponse: function(r) {
    var posts = r.response.posts.map(function(post) { return new TumblrMachinePost(post); });
    this._posts.add(posts);
    this._totalPostsCount = r.response.total_posts;
    return posts;
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
    return this.__postsUrl() + "&before_id=" + this.__posts()[this.__posts().length - 1].id;
  },

  __haveAllPosts: function() {
    return this._posts.length === this._totalPostsCount;
  },

  __isFirstRequest: function() {
    return this._totalPostsCount > 0;
  }
}

// TumblrPost

function TumblrMachinePostsCollection(posts) {
  this._posts = posts || [];
}

TumblrMachinePostsCollection.prototype = {
  add: function(posts) {
    // add post(s) - make sure there aren't any dups
    this._posts = this._posts.concat(posts);
    this.trigger('change', {newValue: posts});
  },

  remove: function(post_or_postID) {
    // remove post
  }
}

// https://www.tumblr.com/docs/en/api/v2#posts
function TumblrMachinePost(post) {

  /* All */
  this.blogName = post.blog_name; // string
  this.id = post.id; // number
  this.postUrl = post.post_url; // string
  this.type = post.type; // string
  this.timestamp = post.timestamp; // number
  this.date = post.date; // string
  this.format = post.format; // string
  this.reblogKey = post.reblog_key; // string
  this.tags = post.tags; // array
  this.bookmarklet = post.bookmarklet; // boolean
  this.mobile = post.mobile; // boolean
  this.sourceUrl = post.source_url; // string
  this.sourceTitle = post.source_title; // string
  this.liked = post.liked; // boolean
  this.state = post.state; // string (published, queued, draft, private)
  this.noteCount = post.note_count; // number
  this.shortUrl = post.short_url; // string

  /* Text */
  if (this.type === "text") {
    this.title = post.title; // string
    this.body = post.body; // string
  }

  /* Photo */
  if (this.type === "photo") {
    this.photos = post.photos; // array
    this.caption = post.caption; // string
    this.width = post.width; // number
    this.height = post.height; // number
    this.imagePermalink = post.image_permalink; // string
  }

  /* Quote */
  if (this.type === "quote" ) {
    this.text = post.text; // string
    this.source = post.source; // string
  }

  /* Link */
  if (this.type === "link") {
    this.title
    this.url = post.url; // string
    this.description = post.description; // string
  }

  /* Chat */
  if (this.type === "chat") {
    this.title
    this.body
    this.dialogue = post.dialogue; // array
  }

  /* Audio */
  if (this.type === "audio") {
    this.caption = post.caption; // string
    this.player = post.player; // string
    this.plays = post.plays; // number
    this.albumArt = post.album_art; // string
    this.artist = post.artist; // string
    this.album = post.album; // string
    this.trackName = post.track_name; // string
    this.trackNumber = post.track_number; // number
    this.year = post.year; // number
  }

  /* Video */
  if (this.type === "video") {
    this.caption; // string
    this.player; // array
  }

  /* Answer */
  if (this.type === "answer") {
    this.askingName = post.asking_name; // string
    this.askingUrl = post.asking_url; // string
    this.question = post.question; // string
    this.answer = post.answer; // string
  }

  this.sizes = ["xs", "s", "m", "l", "xl", "original"];
}

TumblrMachinePost.prototype = {
  imageSizeForSize: function(size) {
    assert(TumblrMachine.prototype.isObject(size) || TumblrMachine.prototype.isString(size), "Invalid argument type");
    assert(this.sizes.indexOf(size) >= 0, "Invalid size: must be one of the following: " + this.sizes);
  },

  imageForSize: function(size) {
  }
}

function assert(condition, message) {
  if ( ! condition) {
    throw message || "Illegal";
  }
}

Object.prototype.bind = function(ev, callback) {
  this.listeners = this.listeners || [];
  var event = {identifier: ev, callback: callback };
  this.listeners.push(event);
}

Object.prototype.trigger = function(ev, data) {
  if ( ! this.listeners || ! this.listeners.length) {
    return;
  }

  for (var i = 0; i < this.listeners.length; i++) {
    var l = this.listeners[i];
    if (l.identifier === ev) {
      l.callback.call(this, data);
    }
  }
}
