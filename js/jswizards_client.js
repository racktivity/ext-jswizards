
function jswizards_class(){

var _baseUrl = null;
var validated = true;
var form = null;
var oldform = null;
var tabs = null;
var session = null;
var that = this;
var dataobj = null;


var callAppserver = function(wizardurl, success) {
          jQuery.ajax({url: wizardurl,
            dataType: 'jsonp',
            success: success,
            jsonp: 'jsonp_callback',
            cache: true,
            error: function(data, error) { alert(data + error); }
          });
    };
    
this.start = function(appname, domainName, wizardName, applicationserverIp, extra) {
    _baseUrl = "http://" + applicationserverIp + "/" + appname + "/appserver/rest/ui/wizard/";
	validated = true;
	var url = _baseUrl + "start?wizardName="+wizardName + 
           "&domainName=" + domainName + "&extra=" + extra;
	callAppserver(url, success);
}

var callResult = function(resultData, success) {
	var url = _baseUrl + "result?sessionId="+session+"&result="+resultData;
	callAppserver(url, success);
}

var callback = function(wizardName, methodName, formData, sessionId){
	var url = _baseUrl + "callback?SessionId="+sessionId+"&wizardName="+wizardName
	+"&methodName="+methodName+"&formData="+formData;
    callAppserver(url, success);
}

var stop = function() {
	var url = _baseUrl + "stop?sessionId=" + session;
    callAppserver(url, function(){});
}

var success = function(data, status){
    if (!data){
       alert("No data returned!!");
    }
    else {
        $('#wizard_save').attr("disabled", false);
       	console.log(data);
        processData(data);
    }
}

var processData = function(jsondata) {
	var endofwizard = false;
    if (jsondata.error){
        alert("Error happened" + jsondata.message);
    }
	if (jsondata[0] != '{') {
			session = jsondata[0];
			dataobj = $.parseJSON(jsondata[1]);
	}
	else {
		dataobj = $.parseJSON(jsondata);
	}

	if (dataobj.hasOwnProperty('action') && dataobj.action == 'endofwizard'){
		endofwizard = true;
	}
	if (endofwizard) {
		that.closeFloatBox(false);
		return;
	}
	if ('params' in dataobj && dataobj.params.hasOwnProperty('tabs')) {
		try{
			tabs = dataobj['params']['tabs'];
		}
		catch (err) {
			console.log(err);
		}
		console.log(dataobj);
	
		form = new JsWizardsForm();
		form.createForm();
		for (tabindex in tabs) {
			form.addTab(tabs[tabindex]['text'], tabs[tabindex]['name']);
			var elements = tabs[tabindex]['elements'];
			var tabid = tabs[tabindex]['name'];
			for (elementindex in elements) {
				var element = elements[elementindex];
				var elementname = element['name'];
				var elementtext = element['text'];
				var controltype = element['control'];
				var optional = element['optional']
                var password;
                var callbackname = null;
                var value = null;
                var message = null;
                var helptext = null;
				if ('password' in element) password = element['password'];
				else password = false;
				if ('callback' in element) callbackname = element['callback'];
				if ('value' in element) value = element['value'];
				if ('message' in element) message = element['message'];
				if ('helpText' in element) helptext = element['helpText'];
	
				if (controltype == 'text') {
					var validator = element['validator'];
					if (password == true) {
						form.addPassword(tabid, elementname, elementtext, value, validator, optional, callbackname, message, helptext);
					}
					else if (element['multiline'] == true) {
						form.addMultiline(tabid, elementname, elementtext, value, validator, optional, callbackname, message, helptext);
					}
					else form.addText(tabid, elementname, elementtext, value, validator, optional, callbackname, message, helptext);
				}
				else if (controltype == 'integer') {

					form.addInteger(tabid, elementname, elementtext, value, null, null, optional, callbackname, message, helptext);
				}
				else if (controltype == 'option') {
					form.addChoice(tabid, elementname, elementtext, element['values'], value, optional, callbackname, message, helptext);
				}
				else if (controltype == 'optionmultiple') {
					form.addChoiceMultiple(tabid, elementname, elementtext, element['values'], value, optional, callbackname, message, helptext);
				}
				else if (controltype == 'label') {
					form.message(tabid, elementname, elementtext, element['bold'], element['multiline']);
				}
				else if (controltype == 'dropdown') {
					form.addDropDown(tabid, elementname, elementtext, element['values'], value, optional, callbackname, message, helptext);
				}
				else if (controltype == 'number') {
					form.addInteger(tabid, elementname, elementtext, value, null, null, optional, callbackname, message, helptext);
				}
				else if (controltype == 'date') {
					form.addDate(tabid, elementname, elementtext, element['minValue'], element['maxValue'], value, callbackname, message, helptext);
				}
				else if (controltype == 'datetime') {
					form.addDateTime(tabid, elementname, elementtext, element['minValue'], element['maxValue'], value, callbackname, message, helptext);
				}
				else {
					alert('control type not defined or not implemented yet !!');
				}
			};
		}
		form.finalize();
	}
	else if ('params' in dataobj){
		processOldStyleData(dataobj);
	}
}

var processOldStyleData = function(dataobj) {
    if (form){
        form.close();
    }
	if (!oldform) {
		oldform = new OldForm();
		//oldform.createForm();
	}
	console.log(dataobj);
	params = dataobj['params'];
	control = params['control'];
	cb = null;
	if (control == 'label') {
		oldform.message(params['text']);
	}
	else if (control == 'text') {
		if (params['password'] == true) {
			cb = oldform.askPassword(params['text'], params['value']);
		}
		else if (params['multiline'] == true) {
			cb = oldform.askMultiline(params['text'], params['value']);
		}
		else {
		cb = oldform.askString(params['text'], params['value']);
		}
	}
	else if (control == 'dropdown') {
		cb = oldform.askDropdown(params['text'], params['values'], params['value']);
	}
	else if (control == 'option') {
		cb = oldform.askChoice(params['text'], params['values'], params['value']);
	}
	else if (control == 'date') {
		cb = oldform.askDate(params['text']);
	}
	else if (control == 'datetime') {
		cb = oldform.askDateTime(params['text']);
	}
	else if (control == 'number') {
		cb = oldform.askInteger(params['text'], params['value']);
	}
	else if (control == 'messagebox') {
		cb = oldform.showMessageBox(params['message'], params['title'], params['msgboxButtons'], params['msgboxIcon'], params['defaultButton'])
	}
	else alert('control type not implemented yet!!');

	if (cb != null) {
		dataobj['callback'] = cb;
	}
}

this.processCallback = function(callbackname) {
	resultdata = that.save(false);
	callback(this.wizardName, callbackname, $.toJSON(resultdata), session)
}

var getActiveTab = function(){
	var mytabs = $('#floatform').tabs();
	var selected = mytabs.tabs('option', 'selected');
	return tabs[selected]['name'];
}

this.save = function(callresult) {
    validated = true;
    $('#wizard_save').attr("disabled", true);
	if ( callresult == undefined ) callresult = true;
	var resultdata = new Object();
	resultdata['activeTab'] = getActiveTab();
	resultdata['tabs'] = tabs;
	//tabs = resultdata['tabs'];
	for (tabindex in tabs) {
		elements = tabs[tabindex]['elements'];
		tabid = tabs[tabindex]['name'];
		for (elementindex in tabs[tabindex]['elements']) {
			var element = elements[elementindex];
			var id = element['name'];
			var controltype = element['control'];
			if (controltype == 'text' || controltype == 'password' || controltype == 'number' || controltype == 'dropdown') {
				callresult &= that.validate(element['validator'], id);
				if (element['optional'] == false) {
					callresult &= validateRequired(element['name']);
				}
				element['value'] = $('#' + id).val();
			}
			else if (controltype == 'option' || controltype == 'optionmultiple') {
				element['value'] = $("input[name="+ id +"]:checked")[0].id;
			}
			else if (controltype == 'date') {
				val = $('#'+id).val();
				parts = val.split('/');
				datevalue = new Date(parts[2], parts[0], parts[1]);
				epoch = datevalue.getTime();
				element['value'] = epoch/1000;
			}
			else if (controltype == 'datetime') {
				val = $('#' + id).val();
				parts = val.split('/');
				month = parts[0];
				day = parts[1];
				subparts = parts[2].split(' ');
				year = subparts[0];
				hour = subparts[1].split(':')[0];
				minute = subparts[1].split(':')[1];
				datevalue = new Date(year, month, day, hour, minute);
				element['value'] = datevalue.getTime()/1000;
			}
		}
	}
	if (callresult == true){
		callResult($.toJSON(resultdata), success)
	}
    else{
        $('#wizard_save').attr("disabled", false);
    }
	return resultdata;
}

this.closeFloatBox = function(callstop){
	if (callstop) {
		stop();
	}
    form.close();
}

this.checkInteger = function(inputval) {
    var res = parseFloat(inputval);
    return res >= 0 || res <= 0;
}

this.next = function() {
	if (dataobj.hasOwnProperty('callback')){
		dataobj['result'] = dataobj['callback']();
	}
	callResult($.toJSON(dataobj), success)
}

var validateRequired = function(id) {
	var obj = $('#' + id);
	var val = obj.val();
	if (!val) {
		doError(obj[0], id + ' is a required field');
		return false;
	}
	else doSuccess(obj[0]);
	return true;
}

this.validate = function(validator, id) {
	if (validator != null) {
		var obj = $('#' + id);
		var val = obj.val();
		var result = false;
        var type = typeof(validator);
        switch(type){
            case "string": 
                var ismatch = val.match(validator);
			    result = ismatch && ismatch[0] == val;
                break;
            case "function": result = validator(val); break;
            default: result = false; break;
        }
        if (result) {
				doSuccess(obj);
		}
	
		else {
			doError(obj, 'validation error. ' + id + ' should match regex ' + validator + ' ' + val);
            return false;
		}
	}
    return true;
}

var doError = function(obj, message) {
	//console.log('in do error');
	validated = false;
    //$('#' + obj.id + '_img').html('<img src="images/exclamation.gif" border="0" style="float:left;" />');
    obj.addClass("error");
    $('#' + obj.attr('id') + '_msg').html(message);
    obj.removeClass("success");
}

var doSuccess = function(o) {
   o.removeClass("error");
   $('#' + o.attr('id') + '_msg').html("");
   o.addClass("success");
}

this.createBubblePopup = function(id, message) {
	$(id).CreateBubblePopup({
		position : 'top',
		align	 : 'center',
		innerHtml: message,
		innerHtmlStyle: {
			color:'#FFFFFF', 
			'text-align':'center'
		},
		themeName: 	'all-black',
		themePath: 	'/static/jswizards/libs/jQueryBubblePopup.v2.3.1_2/jquerybubblepopup-theme'
	});
}

}

jswizards = new jswizards_class();
