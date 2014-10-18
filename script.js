var key = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2"
var t;
var $window;
var $body;
var done = false;
var fetching = false;
var types;

function appendPhotoPost(post, $photos) {
  var medium = post.imagesForSize('m')[0].url;
  var original = post.imagesForSize('original')[0].url;
  $photos.append('<a href="' + original + '" target="_blank"><img src="' + medium + '"></a>');
}

function appendVideoPost(post, $photos) {
  var video = post.videoForSize('m').embed_code;
  $photos.append(video);
}

function appendTextPost(post, $photos) {
  $photos.append('<a href="' + post.postUrl + '" target="_blank">' + post.title + '</a><br>');
}

function processPosts(collection, last) {
  var $photos = $('#photos');
  var posts = collection.posts(types);
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    if (post.hasPhoto()) {
      appendPhotoPost(post, $photos);
    } else if (post.type === "video") {
      appendVideoPost(post, $photos);
    } else if (post.type === "text") {
      appendTextPost(post, $photos);
    }
  }
  done = last;
  fetching = false;
}

function createTumblrMachine(name) {
  fetching = true;
  t = new TumblrMachine(name, key, false, function(collection, last) {
    processPosts(collection, last);
  });
};

function getNextPage() {
  if (!t) return;
  fetching = true;
  t.getNextPage(function(collection, last) {
    processPosts(collection, last);
  });
}

function infinite() {
  if (done || fetching) return;
  if ($window.scrollTop() > $body.height() - $window.height() - 300) {
    getNextPage();
  }
}

$(document).ready(function() {
  $('#form').bind('submit', function(e) {
    e.preventDefault();
    done = false;
    types = $('#types input[type=checkbox]:checked').map(function(idx, elem) { return $(elem).attr('name'); }).splice(0).join(',');
    $('#photos').empty();
    createTumblrMachine($('#blog-name').val());
  });

  $window = $(window);
  $body = $('body');
  $window.bind('scroll', function() {
    infinite();
  });

});

