function Form() {
	
	 this.createForm = function(){
		$.floatbox({
		        content: '<div id="tabs"><ul></ul></div>\
		        <input type="submit" value="Save" onclick="save();"/>\
		        <input type="button" name="cancel" value="Cancel" onclick="window.location=javascript:void(0);" class="close-floatbox"/>',
		        fade: true
		    });
	 }
	
	this.addTab = function (name, tabid){
		$('#tabs > ul' )[0].innerHTML += "<li><a href='#"+ tabid +"'><span>" + name + "</span></a></li>";
	}
	
	this.finalize = function(){
	$("#tabs").tabs();		
	}
	
	function addInput(tabid, type, name, text, value, validator, optional) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		if (typeof value == "undefined") {
			$('#tabs')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
		' + text + '<input type=' + type + ' id=' + name + 'size="25" class=' + required + ' minlength="2" /></div>';
		}
		else {
			$('#tabs')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
		' + text + '<input type=' + type + ' id=' + name + 'size="25" class=' + required + ' value=' + value + ' minlength="2" /></div>';
		}
		return $('form :input').val();
	}
	
	this.addText = function(tabid, name, text, value, validator, optional) {
		addInput(tabid, 'text', name, text, value, validator, optional);
	}

	this.addPassword = function(tabid, name, text, value, optional) {
		addInput(tabid, 'password', name, text, value, optional);
	}
	
	this.addChoice = function(tabid, name, text, values, selectedValue, optional) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (value in values) {
			if (typeof selectedValue != "undefined"){
				choicestring += '<input type="radio"  name=' + name + 'checked />' + values[value][0] + '</br>';
			}
			else choicestring += '<input type="radio"  name=' + name + '/>' + values[value][0] + '</br>';
		}
		$('#tabs')[0].innerHTML += choicestring + '</div>';

		return $('input[name=' + name + ']:checked').val();
	}
	
	this.addChoiceMultiple = function(tabid, name, text, values, selectedValue, optional) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (value in values) {
			choicestring += '<input type="checkbox"  name=' + values[value] + '/>' + values[value] + '</br>';
		}
		$('#tabs')[0].innerHTML += choicestring + '</div>';
		return $('input[name=' + name + ']:checked').val();
	}
	
	this.message = function(tabid, name, text, bold, multiline) {
		if (typeof bold == 'undefined') bold = false;
		if (typeof multiline == 'undefined') multiline = false;
		if (bold == true) text = text.bold();
		
		if (multiline == true) {
			$('#tabs')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
		<textarea id=' + name + ' TextMode="multiLine">' + text + '</textarea>';
		}
		else {
			$('#tabs')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
			<div id=' + name + '>' + text + '</div>';
		}
	}
	
	function save() {
		
	}
}
