
function jswizards_class(){

var _baseUrl = null;
var validated = true;
var form = null;
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
	if (endofwizard && validated == true) {
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
					form.addInteger(tabid, elementname, elementtext, value, optional, callbackname, message, helptext);
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
					form.addInteger(tabid, elementname, elementtext, value, optional, callbackname, message, helptext);
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
	if (!form) {
		form = new OldForm();
		form.createForm();
	}
	console.log(dataobj);
	params = dataobj['params'];
	control = params['control'];
	cb = null;
	if (control == 'label') {
		form.message(params['text']);
	}
	else if (control == 'text') {
		if (params['password'] == true) {
			cb = form.askPassword(params['text'], params['value']);
		}
		else if (params['multiline'] == true) {
			cb = form.askMultiline(params['text'], params['value']);
		}
		else {
		cb = form.askString(params['text'], params['value']);
		}
	}
	else if (control == 'dropdown') {
		cb = form.askDropdown(params['text'], params['values'], params['value']);
	}
	else if (control == 'option') {
		cb = form.askChoice(params['text'], params['values'], params['value']);
	}
	else if (control == 'date') {
		cb = form.askDate(params['text']);
	}
	else if (control == 'datetime') {
		cb = form.askDateTime(params['text']);
	}
	else if (control == 'number') {
		cb = form.askInteger(params['text'], params['value']);
	}
	else if (control == 'messagebox') {
		cb = form.showMessageBox(params['message'], params['title'], params['msgboxButtons'], params['msgboxIcon'], params['defaultButton'])
	}
	else alert('control type not implemented yet!!');

	if (cb != null) {
		dataobj['callback'] = cb;
	}
}

var processCallback = function(callbackname) {
	resultdata = save(false);
	callback(this.wizardName, callbackname, JSON.stringify(resultdata), session)
}

var getActiveTab = function(){
	var mytabs = $('#floatform').tabs();
	var selected = mytabs.tabs('option', 'selected');
	return tabs[selected]['name'];
}

this.save = function(callresult) {
	//if (!this.validated) return;
	if (typeof callresult == 'undefined') callresult = true;
	var resultdata = new Object();
	resultdata['activeTab'] = getActiveTab();
	resultdata['tabs'] = tabs;
	//tabs = resultdata['tabs'];
	for (tabindex in tabs) {
		elements = tabs[tabindex]['elements'];
		tabid = tabs[tabindex]['name'];
		for (elementindex in tabs[tabindex]['elements']) {
			element = elements[elementindex];
			id = element['name'];
			controltype = element['control'];
			if (controltype == 'text' || controltype == 'password' || controltype == 'number') {
				validate(element['validator'], id);
				if (element['optional'] == false) {
					callresult = validateRequired(element['name']);
				}
				element['value'] = $('#' + id).val();
			}
			else if (controltype == 'option' || controltype == 'optionmultiple') {
				element['value'] = $("input[name="+ id +"]:checked")[0].id;
			}
			else if (controltype == 'dropdown') {
				element['value'] = $("select").val();
			}
			else if (controltype == 'date') {
				val = $('#datepicker').val();
				parts = val.split('/');
				datevalue = new Date(parts[2], parts[0], parts[1]);
				epoch = datevalue.getTime();
				element['value'] = epoch/1000;
			}
			else if (controltype == 'datetime') {
				val = $('#datetimepicker').val();
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
		callResult(JSON.stringify(resultdata), success)
	}
	return resultdata;
}

this.closeFloatBox = function(callstop){
	if (callstop) {
		stop();
	}
    form.close();
}

var checkInteger = function(id) {
    var inputval = $('#' + id).val();
    var s_len = inputval.length ;
    var s_charcode = 0;
    for (var s_i=0;s_i<s_len;s_i++) {
       s_charcode = inputval.charCodeAt(s_i);
       if(!((s_charcode>=48 && s_charcode<=57))) {
        alert("Only Numeric Values Allowed");
        inputval = '';
		$('#' + id).focus();
        return false;
      }
    }
    return true;
}

var next = function() {
	if (dataobj.hasOwnProperty('callback')){
		dataobj['result'] = dataobj['callback']();
	}
	callResult(JSON.stringify(dataobj), success)
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

var validate = function(validator, id) {
	if (validator != null) {
		var obj = $('#' + id);
		var val = obj.val();
		var result = val.match(validator);
                if (result) {
			if (result[0] == val){
				doSuccess(obj);
			}
		}
		else {
			doError(obj, 'validation error. ' + id + ' should match regex ' + validator + ' ' + val);
		};
	}
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
    //this.validated = true;
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
