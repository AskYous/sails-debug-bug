function SetBookmark()
{
 	var SD = window.parent;
    // will need a GetBookmark call here to advance if returning to the course
   
    var loc = window.location.href;

    SD.SetBookmark(loc.substring(loc.toLowerCase().lastIndexOf("/scormcontent/")+14, loc.length));
	SD.CommitData();
}

//Automatically set a bookmark for this page.
SetBookmark();
