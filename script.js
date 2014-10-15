var key = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2"
var t;
function processPosts(collection, last) {
  var $photos = $('#photos');
  var $more = $('#more');
  var posts = collection.posts('photo');
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var medium = post.imageForSize('m').url;
    var original = post.imageForSize('original').url;
    $photos.append('<a href="' + original + '" target="_blank"><img src="' + medium + '"></a>');
  }

  $more.toggle(!last);
}

function createTumblrMachine(name) {
  t = new TumblrMachine(name, key, false, function(collection, last) {
    processPosts(collection, last);
  });
};

function getNextPage() {
  t.getNextPage(function(collection, last) {
    processPosts(collection, last);
  });
}

$(document).ready(function() {
  $('#form').bind('submit', function(e) {
    e.preventDefault();
    $('#photos').empty();
    createTumblrMachine($('#blog-name').val());
  });

  $('#more').bind('click', function() {
    getNextPage();
  });
});

