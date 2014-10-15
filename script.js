function createTumblrMachine(name) {
  var $photos = $('#photos');
  var apiKey = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2";
  var blogName = name;

  $photos.empty();

  var t = new TumblrMachine(blogName, apiKey, false, function() {
    var posts = this.posts('photo');
    for (var i = 0; i < posts.length; i++) {
      $photos.append('<img src="' + posts[i].imageForSize('m').url + '">');
    }
  });
};

$(document).ready(function() {
  $('#form').bind('submit', function(e) {
    e.preventDefault();
    createTumblrMachine($('#blog-name').val());
  });
});

