
function Form() {
	
	 this.createForm = function(){
		$.floatbox({
		        content: '<div id="form"><ul></ul></div>\
		        <input type="submit" value="Save" onClick="save()"/>\
		        <input type="button" name="cancel" value="Cancel" onclick="closeFloatBox()"/>',
		        fade: true
		    });
	 }
	
	this.addTab = function (name, tabid){
		$('#form > ul' )[0].innerHTML += "<li><a href='#"+ tabid +"'><span>" + name + "</span></a></li>";
	}
	
	this.finalize = function(){
	$("#form").tabs();
	}
	
	function addInput(tabid, type, name, text, value, validator, optional, callbackname, message, helptext) {
		if (typeof optional == 'undefined') optional = true;
		
		var required = '';
		if (optional == false) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><form name="input"  method="get">';
		if (required != '') {
			contents += text + '*' + '<input type=' + type + ' id=' + name + ' class=' + required + ' minlength="2"';
		}
		else {
			contents += text + '<input type=' + type + ' id=' + name + ' class=' + required + ' minlength="2"';
		}
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' />';
        if (helptext != null) {
        	id = name + helptext.replace(' ', '');
        	console.log(helptext);
        	contents += '<span class="formInfo"><a class="jTip" id=' + id + ' name=' + helptext + '>?</a></span>';
        }
        contents += '</div><div class="validation_error" id="' + name + '_msg"></div>';
		$('#form').append(contents);
		if (validator != null) {
			$('#' + name).change(function(){
				validate(validator, name);
			})
		}
		
		if (message != null) {
			createBubblePopup('#' + name, message);
		}
		
		if (helptext != null) {
			createBubblePopup('.formInfo', helptext);
		}

		if (callbackname != null){
			$('#' + name).change(function(){
				processCallback(callbackname);
			})
		};
	};	

	this.addText = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		addInput(tabid, 'text', name, text, value, validator, optional, callbackname, message, helptext);
	}

	this.addPassword = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		addInput(tabid, 'password', name, text, value, validator, optional, callbackname, message, helptext);
	}
	
	this.addInteger = function(tabid, name, text, value, minvalue, maxvalue, optional, callbackname) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><form name="input"  method="get">\
        ' + text + '<input type="text" id=' + name;
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' /></div>';
		$('#form')[0].innerHTML += contents;
		$('input').change(function(){
			checkInteger(name);
			if (callbackname != null){
				processCallback(callbackname);
			}
		})
	}
	
	this.addChoice = function(tabid, name, text, values, selectedValue, optional, callbackname) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (value in values) {
			stringvalue = values[value][0];
			if (selectedValue != null && selectedValue == value){
				choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" checked="checked" >' + stringvalue + '</input></br>';
			}
			else choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" >'+ stringvalue + '</input></br>';
		}
		$('#form')[0].innerHTML += choicestring + '</div>';
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	}
	
	this.addChoiceMultiple = function(tabid, name, text, values, selectedValue, optional, callbackname) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><form name="input" method="get">' + text + '</br>';
		for (valueindex in values) {
			value = values[valueindex];
			if (selectedValue == value){
				choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + ' checked="checked" >' + value + '</br>';
			}
			else choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + '>' + value + '</br>';
		}
		$('#form')[0].innerHTML += choicestring + '</div>';
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	}
	
	this.addDropDown = function(tabid, name, text, values, selectedValue, optional, callbackname) {
		var htmlstring = '';
		htmlstring += '<div id=' + tabid + '><form name="input" method="get">' + text + '<select id="' + name + '">';
		for (valueindex in values) {
			value = values[valueindex];
			if (selectedValue == value) {
				htmlstring += '<option checked="checked" value=' + valueindex + '>' + value + '</option>';
			}
			else htmlstring += '<option value=' + valueindex + '>' + value + '</option>';
		}
		$('#form')[0].innerHTML += '</select>' + htmlstring + '</div>';
		if (callbackname != null){
			$('select').change(function(){
				processCallback(callbackname);
			})
		};
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

	this.addDate = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		$('#form')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
			<p>' + text + ' <input type="text" id="datepicker" /></p></div>';
		$(function() {
			$("#datepicker").datepicker();
		});
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	};
	
	this.addDateTime = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		$('#form')[0].innerHTML += '<div id=' + tabid + '><form name="input"  method="get">\
			<p>' + text + ' <input id="datetimepicker" type="text" /></p></div>';
		$(function() {
			$("#datetimepicker").datetimepicker();
		});
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	}
	
	this.addMultiline = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><form name="input"  method="get">\
        ' + text + '<textarea id=' + name + ' class=' + required;
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' ></textarea></div>';
		$('#form')[0].innerHTML += contents;
		if (callbackname != null){
			$('input').change(function(){
				processCallback(callbackname);
			})
		};
	}

}
