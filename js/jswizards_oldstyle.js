function Form() {
	
	 this.createForm = function(){
		$.floatbox({
		        content: '<div id="form"><ul></ul></div>\
		        <input type="submit" value="Next" onClick="next()"/>\
		        <input type="button" name="cancel" value="Cancel" onclick="closeFloatBox()"/>',
		        fade: true
		    });
	 }

	function askInput(type, text, value) {
		var contents = '';
		id = text.replace(' ', '');
		contents += '<form name="input"  method="get">\
        ' + text + '<input type=' + type + ' id=' + id + ' minlength="2"';
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' />';
		$('#form').append(contents);
		return function(){
			return $("#" + id).val();
		}
	};

	this.askString = function(question, defaultvalue) {
		return askInput('text', question, defaultvalue);
	}
	
	this.askPassword = function(question, defaultvalue) {
		return askInput('password', question, defaultvalue);
	}
	
	this.message = function(text) {
		$('#form')[0].innerHTML += '<form name="input"  method="get">\
		<div id=' + text + '>' + text + '</div>';
	};
	
	this.askChoice = function(question, choices, defaultValue, sortChoices, sortCallBack) {
		var choicestring = '';
		name = question.replace(' ', '');
		choicestring += '<form name="input" method="get">' + question + '</br>';
		for (choice in choices) {
			stringvalue = choices[choice][0];
			console.log(defaultValue);
			console.log(stringvalue);
			if (defaultValue != null && defaultValue == stringvalue){
				choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" checked="checked" >' + stringvalue + '</input></br>';
			}
			else choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" >'+ stringvalue + '</input></br>';
		}
		$('#form').append(choicestring);

		return function(){
			return $("select").val();
		}
	}
	
	this.askDropdown = function(question, choices, defaultvalue, sortChoices, sortCallBack) {
		var htmlstring = '';
		name = question.replace(' ', '');
		htmlstring += '<form name="input" method="get">' + question + '<select id="' + name + '">';
		for (valueindex in choices) {
			value = choices[valueindex][0];
			console.log(value);
			if (defaultvalue == value) {
				htmlstring += '<option checked="checked" value=' + valueindex + '>' + value + '</option>';
			}
			else htmlstring += '<option value=' + valueindex + '>' + value + '</option>';
		}
		$('#form').append('</select>');
		$('#form').append(htmlstring);

		return function(){
			return $("select").val();
		}
	}
}
