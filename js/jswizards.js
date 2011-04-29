
function JsWizardsForm() {

    var floatform = null;
    var floatbox = null;
    var onfinalize = new Array();
	
	this.createForm = function(){
        floatform = $('<div id="floatform"><ul></ul></div>');
	}
	
	this.addTab = function (name, tabid){
		floatform.find('ul')[0].innerHTML += "<li><a href='#"+ tabid +"'><span>" + name + "</span></a></li>";
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

		contents += '<div id=' + tabid + "_" + name +'>';
		if (required != '') {
			contents += '<label>' + text + '</label>' +'*' + '<input type=' + type + ' id=' + name + ' class="' + required + '" minlength="2"';
		}
		else {
			contents += '<label>' + text + '</label>' +'<input type=' + type + ' id=' + name + ' minlength="2"';
		}
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' />';
        var id = name + "tip";
        if (helptext != null) {
        	contents += createTip(id);
        }
        contents += '</div><div class="validation_error" id="' + name + '_msg"></div>';
		floatform.append(contents);
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
                processCallback(callbackname);
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
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><label>'
         + text + '</label><input type="text" id=' + name;
        if (value != null) {
        	contents += ' value=' + value;
        }
       	var id = name + '_tip';
        if (helptext != null) {
        	contents += createTip(id)
        }
        contents += '</div>';
		floatform.append(contents);
        addFinalizers(name, id, message, helptext, jswizards.checkInteger, callbackname);
	}
	
	this.addChoice = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><label>' + text + '</label></br>';
		for (value in values) {
			stringvalue = values[value][0];
			if (selectedValue != null && selectedValue == value){
				choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" checked="checked" >' + stringvalue + '</input></br>';
			}
			else choicestring += '<input type="radio" id="' + stringvalue + '" name="' + name + '" >'+ stringvalue + '</input></br>';
		}
        var id = name + "_tip";
        if (helptext != null) {
        	choicestring += createTip(id);
        }
		floatform.append(choicestring + '</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	}
	
	this.addChoiceMultiple = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
		var choicestring = '';
		choicestring += '<div id=' + tabid + '><label>' + text + '</label></br>';
		for (valueindex in values) {
			value = values[valueindex];
			if (selectedValue == value){
				choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + ' checked="checked" >' + value + '</br>';
			}
			else choicestring += '<input type="checkbox"  id=' + value + ' name=' + name + '>' + value + '</br>';
		}
        var id = name + "_tip";
        if (helptext != null) {
        	choicestring += createTip(id);
        }
		floatform.append(choicestring + '</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	}
	
	this.addDropDown = function(tabid, name, text, values, selectedValue, optional, callbackname, message, helptext) {
		var htmlstring = '';
		htmlstring += '<div id=' + tabid + '><label>' + text + '</label><select id="' + name + '">';
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
		floatform.append(htmlstring + '</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	}

	this.message = function(tabid, name, text, bold, multiline) {
		if (typeof bold == 'undefined') bold = false;
		if (typeof multiline == 'undefined') multiline = false;
		if (bold == true) text = text.bold();
		
		if (multiline == true) {
			floatform[0].innerHTML += '<div id=' + tabid + '>\
		<textarea id=' + name + ' TextMode="multiLine">' + text + '</textarea>';
		}
		else {
			floatform[0].innerHTML += '<div id=' + tabid + '>\
			<div id=' + name + '>' + text + '</div>';
		}
	}

	this.addDate = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname, message, helptext) {
		//#TODO: Implement minValue and maxValue and floatformat
		//#TODO: Make sure the returned value is in epoch like with flash
		floatform.append('<div id=' + tabid + '></label>' + text + '</label><p> <input type="text" name="input_date" id="' + name + '" /></p>');
        var id = name + "_tip";
        if (helptext != null) {
        	floatform.append(createTip(id));
        }
        floatform.append('</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	};
	
	this.addDateTime = function(tabid, name, text, minValue, maxValue, selectedValue, callbackname, message, helptext) {
		//#TODO: Implement minValue and maxValue and format
		//#TODO: Make sure the returned value is in epoch like with flash
		floatform.append('<div id=' + tabid + '><label>' + text + '</label><p><input name="input_datetime" id="' + name + '" type="text" /></p>');
        var id = name + "_tip";
        if (helptext != null) {
        	floatform.append(createTip(id));
        }
        floatform.append('</div>');
        addFinalizers(name, id, message, helptext, null, callbackname);
	}
	
	this.addMultiline = function(tabid, name, text, value, validator, optional, callbackname, message, helptext) {
		if (!optional) optional = true;
		
		var required = '';
		if (optional == true) {
			required = 'required';
		}
		var contents = '';

		contents += '<div id=' + tabid + '><label>' + text + '</label><textarea id=' + name + ' class=' + required;
        if (value != null) {
        	contents += ' value=' + value;
        }
        contents += ' ></textarea>';
        var id = name + "_tip";
        if (helptext != null) {
        	contents += createTip(id);
        }
        contents += '</div>';
		floatform.append(contents);
        addFinalizers(name, id, message, helptext, null, callbackname);
	}

}
