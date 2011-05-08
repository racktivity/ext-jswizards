
function JsWizardsForm() {

    var floatform = null;
    var floatbox = null;
    var onfinalize = new Array();
	
	this.createForm = function(){
        floatform = $('<div id="floatform"></div>').append("<ul>").append("<div>");
	}
	
	this.addTab = function (name, tabid){
		floatform.find('ul').append("<li><a href='#"+ tabid +"'><span>" + name + "</span></a></li>");
        floatform.append($("<div>").attr("id", tabid).attr('class', 'wizard-tab'));
	}

    this.clear = function(){
        $("#floatform").empty();
        floatform = $('<div id="floatform"></div>').append("<ul>");
    }
	
	this.finalize = function(){
	    floatform.tabs();
        floatform.append('<input type="button" id="wizard_save" value="Save" onClick="jswizards.save(true)"/>\
		        <input type="button" name="cancel" value="Cancel" onclick="jswizards.closeFloatBox()"/>');

		$.floatbox({
		        content: floatform,
                buttonPosition: "none",
		        fade: true,
		    });
        $("[name='input_datetime']").datetimepicker();
        $("[name='input_date']").datepicker();
        $.each(onfinalize, function(idx, cb){
            cb();
        });
        floatform = $("#floatform");

	}

    this.close = function(){
        var settings = { bg : "floatbox-background",
                         box : "floatbox-box"};
        $("#" + settings.box).fadeOut(200, function () {
            $("#" + settings.bg).fadeOut(200, function () {
                $("#" + settings.box).remove();
                $("#" + settings.bg).remove();
           });
        });
    }
	
	var addInput = function(tabid, type, name, text, value, validator, optional, callbackname, message, helptext) {
		if (typeof optional == 'undefined') optional = true;
		
		var required = '';
		if (optional == false) {
			required = 'required';
		}
		var contents = '';
        var maindiv = $('<div>');
        maindiv.append($('<label>').text(text));
        if (required != ''){
            maindiv.append("*");
        }
        var input = $("<input>").attr('type', type).attr('id', name).attr('minlength', "2");
        if (required != ''){
            input.attr('class', required);
        }
        if (value != null){
            input.attr('value', value);
        }
        maindiv.append(input);
        var id = name + "_tip";
        if (helptext != null) {
        	maindiv.append(createTip(id));
        }
        maindiv.append($('<div>').attr('class', 'validation_error').attr('id', name + "_msg"));
		floatform.find("#"+tabid).append(maindiv);
        addFinalizers(name, id, message, helptext, validator, callbackname);
	};	


    var addFinalizers = function(id, tipid, message, helptext, validator, callbackname){
    	if (validator != null) {
            addOnChange(id, validator);
		}
		
		if (message != null) {
            addBubble(id, message);
		}
		
		if (helptext != null) {
            addBubble(tipid, helptext);
		}

		if (callbackname != null){
            addCallback(id, callbackname);
		};

    }

    var addCallback = function(id, callbackname){
        onfinalize.push(function() {
            $("#"+id).change(function(){
                jswizards.processCallback(callbackname);
            });
        });
    }

    var addOnChange = function(id, validator){
        onfinalize.push(function() {
            $("#"+id).change(function() {
                jswizards.validate(validator, id);
            });
        });
    }

    var addBubble = function(id, message){
        onfinalize.push(function() { jswizards.createBubblePopup("#"+id, message);});
    }

    var createTip = function(id){
        return '<span class="formInfo"><a id=' + id + '>?</a></span>';
    }


	this.addText = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		addInput(tabid, 'text', name, text, value, validator, optional, callbackname, message, helptext);
	}

	this.addPassword = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		addInput(tabid, 'password', name, text, value, validator, optional, callbackname, message, helptext);
	}
	
	this.addInteger = function(tabid, name, text, value, minvalue, maxvalue, optional, callbackname, message, helptext) {
		addInput(tabid, 'text', name, text, value, jswizards.checkInteger, optional, callbackname, message, helptext);
	}
	
	this.addChoice = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
		var choicestring = '';
        var maindiv = $("<div>");
        maindiv.append($("<b>").text(text)).append("<br />");
		choicestring += '<div><b>' + text + '</b></br>';
		for (value in values) {
			var choicetext = values[value][0];
			var choicevalue = values[value][1];
            var choice = $('<div>')
            var input = $("<input>").attr("type", "radio").attr("name", name).attr('value', $.toJSON(choicevalue));
			if (selectedValue != null && selectedValue == choicevalue){
                input.attr("checked", "checked");
			}
            choice.append(input).append(choicetext);
            maindiv.append(choice);
		}
        var id = name + "_tip";
        if (helptext != null) {
        	maindiv.append(createTip(id));
        }
		floatform.find("#"+tabid).append(maindiv);
        addFinalizers(name, id, message, helptext, null, callbackname);
	}
	
	this.addChoiceMultiple = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
        var maindiv = $("<div>").append($("<b>").text(text)).append("<br />");
		for (var valuename in values) {
			var value = values[valuename];
            var input = $("<input>").attr("type", "checkbox").attr("name", name).attr("value", $.toJSON(value));
			if (selectedValue == value){
                input.attr("checked", "checked");
			}
            maindiv.append(input).append(valuename).append($("<br>"));
		}
        var id = name + "_tip";
        if (helptext != null) {
            maindiv.append(createTip(id));
        }
		floatform.find("#"+tabid).append(maindiv);
        addFinalizers(name, id, message, helptext, null, callbackname);
	}


    this.getMultiChoiceValues = function(name) {
        var values = new Array();
        $("input[name=" + name + "]:checked").each(function(){
            values.push($.parseJSON($(this).val()));
        });
        return values;
    }
	
	this.addDropDown = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
		var htmlstring = '';
		htmlstring += '<div><label>' + text + '</label><select id="' + name + '">';
		for (valueindex in values) {
			value = values[valueindex];
			if (selectedValue == value) {
				htmlstring += '<option checked="checked" value=' + valueindex + '>' + value + '</option>';
			}
			else htmlstring += '<option value=' + valueindex + '>' + value + '</option>';
		}
		htmlstring += '</select>';
        var id = name + "_tip";
        if (helptext != null) {
        	htmlstring += createTip(id);
        }
		floatform.find("#"+tabid).append(htmlstring + '</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	}

	this.message = function(tabid, name, text, bold, multiline) {
		if (typeof bold == 'undefined') bold = false;
		if (typeof multiline == 'undefined') multiline = false;
		if (bold == true) text = text.bold();
	    var message = $('<div>').append($("<p>").text(text));	
		floatform.find("#"+tabid).append(message);
	}

	this.addDate = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname, message, helptext) {
		//#TODO: Implement minValue and maxValue and floatformat
		//#TODO: Make sure the returned value is in epoch like with flash
        var content = '<div></label>' + text + '</label><p> <input type="text" name="input_date" id="' + name + '" /></p>';
        var id = name + "_tip";
        if (helptext != null) {
        	content += createTip(id);
        }
        content += '</div>';
		floatform.find("#"+tabid).append(content);
        addFinalizers(name, id, message, helptext, null, callbackname);
	};
	
	this.addDateTime = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname, message, helptext) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		var content = '<div id=' + tabid + '><label>' + text + '</label><p><input name="input_datetime" id="' + name + '" type="text" /></p>';
        var id = name + "_tip";
        if (helptext != null) {
        	content += createTip(id);
        }
        content += '</div>';
        floatform.find("#"+tabid).append(content);
        addFinalizers(name, id, message, helptext, null, callbackname);
	}
	
	this.addMultiline = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div><b>' + text + '</b><textarea id=' + name + ' class=' + required;
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' ></textarea>';
        var id = name + "_tip";
        if (helptext != null) {
        	contents += createTip(id);
        }
        contents += '</div>';
		floatform.find("#"+tabid).append(contents);
        addFinalizers(name, id, message, helptext, null, callbackname);
	}

	this.showMessageBox = function(message, title, msgboxButtons, msgboxIcon, defaultButton) {
		//#TODO: keep focus on the default button, currently it loses focus immidiately after loading
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
					jswizards.next(button);
					$(this).dialog("close");
                }
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
		});
	}
	


}
