/*
 * TumblrMachine: by Mike Kavouras
 *
 * Version: 0.5
 * Tumblr API Version: 2.0
*/

function TumblrMachine(name, apiKey, preventFetch, onReady) {

  assert(name !== null, "TumblrMachine: Please provide a blog name");
  assert(apiKey !== null, "TumblrMachine: Please provide an API key");

  this._posts = [];
  this._blogName = name;
  this._apiKey = apiKey;
  this._firstFetch = true;

  var self = this;
  this._apiManager = new TumblrMachineAPIManager(name, apiKey);

  this.__setupObservers();

  if (preventFetch !== true) {
    this.getPosts(this, onReady, null);
  }
}

TumblrMachine.prototype = {
  posts: function(type) {
    if ( ! type) {
      return this._posts;
    } else {
      return this._posts.filter(function(post) {
        return post.type === type;
      });
    }
  },

  getPosts: function(a, b, c) {
    if ( ! this.firstFetch) {
      this.getNextPage(a, b, c);
    } else {
      // if no params
      if ( ! a) {
        this._apiManager.__fetchPosts(this);
      }

      // if params && isFunction
      else if (a && TumblrMachine.prototype.isFunction(a)) {
        this._apiManager.__fetchPosts(this, a, b);
      }

      else if (a && TumblrMachine.prototype.isNumber(a)) {
        // this.__fetchNumberOfPosts(a, b, c);
      }
    }
  },

  getNextPage: function(success, error) {
    if ( ! this.hasMorePosts() && ! this._firstFetch) {
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
    };
    block();
  },

  imageForPost: function(post) {
    if (TumblrMachine.prototype.isNumber(post)) {
      post = this._apiManager.__getPostById(post);
    }

    if (typeof(post) === "undefined") {
      console.error("TumblrMachine: The post requested does not exist");
      return null;
    }

    return post.type === "photo" ? post.photos[0].original_size.url : post.thumbnail_url;
  },

  imagesForPosts: function(argv) {
    var posts = this.posts;
    var photos = [];

    if ( ! argv) {
      posts = this.posts;
    } else if (! TumblrMachine.prototype.isNumber(argv) || ! TumblrMachine.prototype.isArray(argv)) {
      console.error("TumblrMachine: imagesForPosts - invalid argument");
      return;
    }

    if (TumblrMachine.prototype.isNumber(argv)) {
      posts = this._posts.slice(0, Math.min(argv, this._posts.length));
    } else if (TumblrMachine.prototype.isArray(argv)) {

      // empty array
      if ( ! argv.length) {
        return [];
      }

      var arr = argv;
      if (TumblrMachine.prototype.isNumber(arr[0]) && arr.length === 2) {
        posts = this.posts.slice(arr[0], Math.min(arr[1], this.posts.length));
      } else if (TumblrMachine.prototype.isObject(arr[0])) {
        posts = arr;
      } else {
        console.error("TumblrMachine: imagesForPosts - invalid argument");
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

  __setupObservers: function() {
    var self = this;

    this._apiManager.bind('fetched', function() {
      self._firstFetched = false;
    });

    this._apiManager._posts.bind('update', function(change) {
      self._posts = change.newValue;
    });
  }
};

// Convenience
TumblrMachine.prototype.isArray = function(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
};
TumblrMachine.prototype.isObject = function(x) {
  return Object.prototype.toString.call(x) === "[object Object]";
};
TumblrMachine.prototype.isString = function(x) {
  return Object.prototype.toString.call(x) === "[object String]";
};
TumblrMachine.prototype.isNumber = function(x) {
  return Object.prototype.toString.call(x) === "[object Number]";
};
TumblrMachine.prototype.isFunction = function(x) {
  return Object.prototype.toString.call(x) === "[object Function]";
};

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

  __fetchPosts: function(machine, success, error) {
    this.__fetchPostsWithUrl(machine, success, error, this.__postsUrl());
  },

  __fetchNextPageOfPosts: function(machine, success, error) {
    this.__fetchPostsWithUrl(machine, success, error, this.__nextPageUrl());
  },

  __fetchNumberOfPosts: function(n, success, error) {

  },

  __fetchAllPosts: function(success, error) {

  },

  __fetchPostsWithUrl: function(machine, success, error, url) {
    var self = this;
    $.getJSON(url, function(r) {
      self.trigger('fetched');
      var posts = self.__processPostsFromResponse(r);
      if (r.meta.status === 200) {
        if (success) {
          success.call(machine, posts);
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
};

// TumblrPost

function TumblrMachinePostsCollection(posts) {
  this._posts = posts || [];
}

TumblrMachinePostsCollection.prototype = {
  add: function(posts) {
    // add post(s) - make sure there aren't any dups
    this._posts = this._posts.concat(posts);
    this.trigger('update', {newValue: this._posts});
  },

  remove: function(postOrPostID) {
    // remove post
  }
};

// https://www.tumblr.com/docs/en/api/v2#posts
function TumblrMachinePost(post) {
  this.sizes = ["xs", "s", "m", "l", "xl", "original"];
  this._setup(post);
}

TumblrMachinePost.prototype = {

  imageForSize: function(size) {
    assert(TumblrMachine.prototype.isObject(size) || TumblrMachine.prototype.isString(size), "Invalid argument type");
    assert(this.sizes.indexOf(size) >= 0, "Invalid size: must be one of the following: " + this.sizes);
    assert(this.photos && this.photos.length > 0, "This post has no photos");

    var photo = this.photos[0];
    var idx = (photo.alt_sizes.length - 1) - this.sizes.indexOf(size);
    return photo.alt_sizes[idx];
  },

  // @private

  _setup: function(post) {

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

    switch (this.type) {
      case "text":
        this._setupTextPost(post);
        break;
      case "photo":
        this._setupPhotoPost(post);
        break;
      case "quote":
        this._setupQuotePost(post);
        break;
      case "link":
        this._setupLinkPost(post);
        break;
      case "chat":
        this._setupChatPost(post);
        break;
      case "audio":
        this._setupAudioPost(post);
        break;
      case "video":
        this._setupVideoPost(post);
        break;
      case "answer":
        this._setupAnswerPost(post);
        break;
    }
  },

  _setupTextPost: function(post) {
    this.title = post.title; // string
    this.body = post.body; // string
  },

  _setupPhotoPost: function(post) {
    this.photos = post.photos; // array
    this.caption = post.caption; // string
    this.width = post.width; // number
    this.height = post.height; // number
    this.imagePermalink = post.image_permalink; // string
  },

  _setupQuotePost: function(post) {
    this.text = post.text; // string
    this.source = post.source; // string
  },

  _setupLinkPost: function(post) {
    this.title = post.title;
    this.url = post.url; // string
    this.description = post.description; // string
  },

  _setupChatPost: function(post) {
    this.title = post.title;
    this.body = post.body;
    this.dialogue = post.dialogue; // array
  },

  _setupAudioPost: function(post) {
    this.caption = post.caption; // string
    this.player = post.player; // string
    this.plays = post.plays; // number
    this.albumArt = post.album_art; // string
    this.artist = post.artist; // string
    this.album = post.album; // string
    this.trackName = post.track_name; // string
    this.trackNumber = post.track_number; // number
    this.year = post.year; // number
  },

  _setupVideoPost: function(post) {
    this.caption = post.caption; // string
    this.player = post.player; // array
  },

  _setupAnswerPost: function(post) {
    this.askingName = post.asking_name; // string
    this.askingUrl = post.asking_url; // string
    this.question = post.question; // string
    this.answer = post.answer; // string
  }

};

function assert(condition, message) {
  if ( ! condition) {
    throw message || "Illegal";
  }
}

Object.prototype.bind = function(ev, callback) {
  this.listeners = this.listeners || [];
  var event = {identifier: ev, callback: callback };
  this.listeners.push(event);
};

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
};
