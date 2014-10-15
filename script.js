var t;

function createTumblrMachine(name) {
  var $photos = $('#photos');
  var apiKey = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2";
  var blogName = name;

  $photos.empty();

  t = new TumblrMachine(blogName, apiKey, false, function(collection, last) {
    var posts = collection.posts('photo');
    for (var i = 0; i < posts.length; i++) {
      $photos.append('<img src="' + posts[i].imageForSize('m').url + '">');
    }

    $('#more').show();
    if (last) {
      $('#more').hide();
    }
  });
};

function getNextPage() {
  var $photos = $('#photos');
  t.getNextPage(function(collection, last) {
    console.log(last);
    var posts = collection.posts('photo');
    for (var i = 0; i < posts.length; i++) {
      $photos.append('<img src="' + posts[i].imageForSize('m').url + '">');
    }

    if (last) {
      $('#more').hide();
    }
  });
}

$(document).ready(function() {
  var $more = $('#more');

  $('#form').bind('submit', function(e) {
    e.preventDefault();
    createTumblrMachine($('#blog-name').val());
  });

  $more.bind('click', function() {
    getNextPage();
  });
});

