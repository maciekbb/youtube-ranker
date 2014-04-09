$(function(){ 
  
  var wall = new freewall( '#movies.index' );
  
  wall.reset({
    animate: false,
    selector: 'article',
    gutterX: 4,
    gutterY: 4,
    cellW: 250,
    cellH: 140,
    onResize: function() {
      wall.fitWidth();
    }
  });
  
  wall.fitWidth();

  $( window ).trigger( 'resize' );

});