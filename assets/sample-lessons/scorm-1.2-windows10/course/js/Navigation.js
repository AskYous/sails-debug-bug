var Navigation = {
	
	loadPages:function(link){
	
		var url = $(link).attr('url');
		var h = (($(window).height()*75)/100-10);
		var htmlContent = "<iframe name='ContentFrame' id= 'ContentFrame' allowtransparency='true' scrolling='no' frameborder='0' src='" +Framework.protocol+url +"' width='100%' height='" + h + "'></iframe>";
		View.updateElements("player",htmlContent);
		var id = $(link).attr('id');
		Framework.PageVisitedStatus[id] = 1;
		Framework.currentIndex = id;
		$('#pageno').html("Page " + (parseInt(id) + 1)+" of "+ courseArray.length);
		
		var percentage = ((Utils.getCount(Framework.PageVisitedStatus, 1))/courseArray.length)*$('#progress').width();
		$('#fill').width(percentage);
		$('#progressTxt').text(Math.ceil(percentage) +"%");
		$(link).addClass('completed');
		
		if(id == 0){
			$('#back').addClass('disable');
		}else{
			$('#back').removeClass('disable');
		} 
		
		if(courseArray.length-1 == Framework.currentIndex){
			$('#next').addClass('disable');
		}else{
			$('#next').removeClass('disable');
		}
		
		Navigation.sendStatus();
		
		
		
		//alert(htmlContent);
	},
	
	navigation:function(options){
		//alert("in navigation :: "  + options.Lesson_location);
		if(options.Lesson_location != "" && options.Lesson_location != null && options.Lesson_location != "undefined"){
			Framework.currentIndex = options.Lesson_location;
			Framework.PageVisitedStatus = options.PageVisitedStatus.split(",")
			
			Navigation.markCompletion();
			$('#disabler').show();
			$('#bookmark_container').show();
		}else{
			$('#0').click();
		}
		//$('#'+Framework.currentIndex).click();

	},
	
	markCompletion:function(){
		//alert(Framework.PageVisitedStatus.length);
		for(i=0;i<Framework.PageVisitedStatus.length;i++){
			//alert(Framework.PageVisitedStatus[i]);
			if(Framework.PageVisitedStatus[i] == 1){
				$('#'+i).addClass('completed');	
			}
		}
	},
	
	sendStatus:function(){
	
		var cnt = 0;
		for(i=0;i<Framework.PageVisitedStatus.length;i++){
			
			if(Framework.PageVisitedStatus[i] == 1){
				cnt++;
			}
		}
		
		var score = Math.ceil((cnt/Framework.PageVisitedStatus.length)*100);
		if(cnt ==Framework.PageVisitedStatus.length){
			Framework.completion = "completed";
		}
		
		if(Framework.mode == "scorm"){
			doLMSSetValue(Framework.completion,Framework.currentIndex, Framework.PageVisitedStatus.toString(),score );
		}else if(Framework.mode == "scorm13"){
		
		}else if(Framework.mode == "tincan"){
			Tincan.putData(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}else{
			Web.set(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}
	},
	
	exit:function(){
		if(Framework.mode == "scorm"){
			doLMSFinish();
		}else if(Framework.mode == "scorm13"){
		
		}else if(Framework.mode == "tincan"){
			Tincan.putData();
		}else{
			Web.set(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}
	}

}