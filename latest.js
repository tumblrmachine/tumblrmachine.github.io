$(document).ready(function() {
  $('#form').bind('submit', function(e) {
    e.preventDefault();

    var key = "2W5eRXOm7i0ZpdlEKi3g2G6wCAOJsTBpJ45aenzuNGikak9tl2"
    var name = $('#blog-name').val();
    t = new TumblrMachine(name, key, false, function(collection, isLast) {
      var post = collection.posts()[0];
      console.log(post);
      var content = post.content();
      $('#photos').html(content);
    });

  });
});
