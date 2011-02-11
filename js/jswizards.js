function Form() {
	
	 this.createForm = function(){
		$.floatbox({
		        content: '<div id="form"><ul></ul></div>\
		        <input type="submit" value="Save" onClick="save()"/>\
		        <input type="button" name="cancel" value="Cancel" onclick="closeFloatBox()" class="close-floatbox"/>',
		        fade: true
		    });
	 }
	
	this.addTab = function (name, tabid){
		$('#form > ul' )[0].innerHTML += "<li><a href='#"+ tabid +"'><span>" + name + "</span></a></li>";
	}
	
	this.finalize = function(){
	$("#form").tabs();
	}
	
	function addInput(tabid, type, name, text, value, optional, callbackname) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><form name="input"  method="get">\
        ' + text + '<input type=' + type + ' id=' + name + ' size="25" class=' + required + ' minlength="2"';
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' /></div>';
		$('#form')[0].innerHTML += contents;
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	};	
	
	this.addText = function(tabid, name, text, value, optional, callbackname) {
		addInput(tabid, 'text', name, text, value, optional, callbackname);
	}

	this.addPassword = function(tabid, name, text, value, optional, callbackname) {
		addInput(tabid, 'password', name, text, value, optional, callbackname);
	}
	
	this.addChoice = function(tabid, name, text, values, selectedValue, optional, callbackname) {
		console.log('selectedValue='+selectedValue);
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (value in values) {
			console.log('value: '+values[value][1]);
			stringvalue = values[value][0];
			if (selectedValue != null && selectedValue == values[value][1]){
				choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" checked="checked" >' + stringvalue + '</input></br>';
			}
			else choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" >'+ stringvalue + '</input></br>';
		}
		alert(choicestring);
		$('#form')[0].innerHTML += choicestring + '</div>';
	}
	
	this.addChoiceMultiple = function(tabid, name, text, values, selectedValue, optional, callbackname) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (value in values) {
			choicestring += '<input type="checkbox"  name=' + values[value] + '/>' + values[value] + '</br>';
		}
		$('#form')[0].innerHTML += choicestring + '</div>';
	}
	this.message = function(tabid, name, text, bold, multiline) {
		if (typeof bold == 'undefined') bold = false;
		if (typeof multiline == 'undefined') multiline = false;
		if (bold == true) text = text.bold();
		
		if (multiline == true) {
			$('#form')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
		<textarea id=' + name + ' TextMode="multiLine">' + text + '</textarea>';
		}
		else {
			$('#form')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
			<div id=' + name + '>' + text + '</div>';
		}
	}
	
}
