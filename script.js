var key = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2"
var t;
var $window;
var $body;
var done = false;
var fetching = false;

function processPosts(collection, last) {
  var $photos = $('#photos');
  var posts = collection.posts('photo');
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var medium = post.imageForSize('m').url;
    var original = post.imageForSize('original').url;
    $photos.append('<a href="' + original + '" target="_blank"><img src="' + medium + '"></a>');
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
    $('#photos').empty();
    createTumblrMachine($('#blog-name').val());
  });

  $window = $(window);
  $body = $('body');
  $window.bind('scroll', function() {
    infinite();
  });

});

