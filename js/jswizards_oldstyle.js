function OldForm() {
	
	 this.createForm = function(){
		$.floatbox({
		        content: '<div id="form"><ul></ul></div>\
		        <input type="submit" value="Next" onClick="jswizards.next()"/>\
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
	
	this.askMultiline = function(question, defaultValue) {
		var contents = '';
		name = question.replace(' ', '');
		contents += '<form name="input"  method="get">\
        ' + question + '<textarea id=' + name;
        if (defaultValue != null) {
        	contents += ' value=' + defaultValue;
        }
        contents += ' ></textarea>';
		$('#form').append(contents);

		return function(){
			return $("#" + name).val();
		}
	}
	
	this.askChoice = function(question, choices, defaultValue, sortChoices, sortCallBack) {
		var choicestring = '';
		name = question.replace(' ', '');
		choicestring += '<form name="input" method="get">' + question + '</br>';
		for (choice in choices) {
			stringvalue = choices[choice][0];
			if (defaultValue != null && defaultValue == stringvalue){
				choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" checked="checked" >' + stringvalue + '</input></br>';
			}
			else choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" >'+ stringvalue + '</input></br>';
		}
		$('#form').append(choicestring);

		return function(){
			return $("input[name="+ name +"]:checked")[0].id;
		}
	};
	
	this.addChoiceMultiple = function(question, values, selectedValue, sortChoices, sortCallBack) {
		var choicestring = '';
		name = question.replace(' ', '');
		choicestring += '<form name="input" method="get">' + question + '</br>';
		for (valueindex in values) {
			value = values[valueindex];
			if (selectedValue == value){
				choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + ' checked="checked" >' + value + '</br>';
			}
			else choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + '>' + value + '</br>';
		}
		$('#form').append(choicestring);
		
		return function(){
			return $("input[name="+ name +"]:checked")[0].id;
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
	
	this.askInteger = function(question, defaultValue) {
		var contents = '';
		name = question.replace(' ', '');
		contents += '<form name="input"  method="get">\
        ' + question + '<input type="text" id=' + name;
        if (defaultValue != null) {
        	contents += ' value=' + defaultValue;
        }
        contents += ' />';
		$('#form').append(contents);
		$('input').change(function(){
			checkInteger(name);
		})
		
		return function(){
			return $('#' + name).val();
		}
	}
	
	this.askDate = function(question, minValue, maxValue, selectedValue, format) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		$('#form').append('<form name="input"  method="get">\
			<p>' + question + ' <input type="text" id="datepicker" /></p>');
		$(function() {
			$("#datepicker").datepicker();
		});
		
		return function() {
			val = $('#datepicker').val();
			parts = val.split('/');
			datevalue = new Date(parts[2], parts[0], parts[1]);
			epoch = datevalue.getTime();
			return epoch/1000;
		}
	}
	
	this.askDateTime = function(question, minValue, maxValue, selectedValue, format) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		$('#form').append('<form name="input"  method="get">\
			<p>' + question + ' <input id="datetimepicker" type="text" /></p>');
		$(function() {
			$("#datetimepicker").datetimepicker();
		});
		
		return function(){
			val = $('#datetimepicker').val();
			parts = val.split('/');
			month = parts[0];
			day = parts[1];
			subparts = parts[2].split(' ');
			year = subparts[0];
			hour = subparts[1].split(':')[0];
			minute = subparts[1].split(':')[1];
			datevalue = new Date(year, month, day, hour, minute);
			return datevalue.getTime()/1000;
		}
	};

	this.showMessageBox = function(message, title, msgboxButtons, msgboxIcon, defaultButton) {
		//#TODO: keep focus on the default button, currently it loses focus immidiately after loading
		var result = null;
		var cb = function(){
			return result;
		};
		if (msgboxButtons == 'OKCancel') {
			buttons = ['Ok', 'Cancel'];
		}
		else if (msgboxButtons == 'YesNo') {
			buttons = ['Yes', 'No'];
		}
		else if (msgboxButtons == 'YesNoCancel') {
			buttons = ['Yes', 'No', 'Cancel'];
		}
		else buttons = ['Ok'];
		
		buttonoptions = new Array(buttons.length);
		$.each(buttons, function(index, button) {
			buttonoptions[index] = {	
				text: button,
				click: function() {
					result = button;
					$(this).dialog("close");}
			};
		})
	
		$('#container').append('<div id="dialog" />');	
		$("#dialog").dialog({
			buttons: buttonoptions,
			show: 'slide',
			title: title,
			
			});
		iconpaths = {
			'Information': '/static/jswizards/icons/information.png',
			'Error': '/static/jswizards/icons/error.png',
			'Warning': '/static/jswizards/icons/warning.png',
			'Question': '/static/jswizards/icons/question.png'
		}
		$('#dialog').append("<img src='" + iconpaths[msgboxIcon] + "' align='left'/>");
		$('#dialog').append(message);
		$.each($('button', '#dialog'), function(index, buttontag){
			if (buttontag.textContent == defaultButton) {
				buttontag.focus();
			}
		})
		return cb;
	}
	
 }
