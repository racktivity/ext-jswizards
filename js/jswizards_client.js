var callAppserver = function(wizardurl, success) {
          jQuery.ajax({url: wizardurl,
            dataType: 'jsonp',
            success: success,
            jsonp: 'jsonp_callback',
            cache: true,
            error: function(data, error) { alert(data + error); }
          });
    };
    
var start = function(appname, domainName, wizardName, applicationserverIp, extra, success) {
    this.appname = appname;
	this.applicationserverIp = applicationserverIp;
    this.baseUrl = "http://" + applicationserverIp + "/" + appname + "/appserver/rest/ui/wizard/";
	this.wizardName = wizardName;
	this.validated = true;
	url = this.baseUrl + "start?wizardName="+wizardName + 
           "&domainName=" + domainName + "&extra=" + extra;
	callAppserver(url, success);
}

var callResult = function(sessionId, resultData, success) {
	url = this.baseUrl + "result?sessionId="+sessionId+"&result="+resultData;
	callAppserver(url, success);
}

var callback = function(wizardName, methodName, formData, sessionId){
	url = this.baseUrl + "callback?SessionId="+sessionId+"&wizardName="+wizardName
	+"&methodName="+methodName+"&formData="+formData;
    callAppserver(url, success);
}

var stop = function(sessionId) {
	url = this.baseUrl + "stop?sessionId=" + sessionId;
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

function processData(jsondata) {
	this.endofwizard = false;
    if (jsondata.error){
        alert("Error happened" + jsondata.message);
    }
	if (jsondata[0] != '{') {
			this.sessionId = jsondata[0];
			this.dataobj = JSON.parse(jsondata[1]);
	}
	else {
		this.dataobj = JSON.parse(jsondata);
	}

	if (dataobj.hasOwnProperty('action') && dataobj.action == 'endofwizard'){
		this.endofwizard = true;
	}
	if (this.endofwizard && this.validated == true) {
		closeFloatBox(false);
		return;
	}
	if ('params' in dataobj && dataobj.params.hasOwnProperty('tabs')) {
		try{
			this.tabs = this.dataobj['params']['tabs'];
		}
		catch (err) {
			console.log(err);
		}
		console.log(dataobj);
		$form = $('#form');
		$form.replaceWith($form.html());
	
		form = new Form();
		form.createForm();
		for (tabindex in tabs) {
			form.addTab(tabs[tabindex]['text'], tabs[tabindex]['name']);
			elements = tabs[tabindex]['elements'];
			tabid = tabs[tabindex]['name'];
			for (elementindex in elements) {
				element = elements[elementindex];
				elementname = element['name'];
				elementtext = element['text'];
				controltype = element['control'];
				optional = element['optional']
				if ('password' in element) password = element['password'];
				else password = false;
				if ('callback' in element) callbackname = element['callback'];
				else callbackname = null;
				if ('value' in element) value = element['value'];
				else value = null;
				if ('message' in element) message = element['message'];
				else message = null;
				if ('helpText' in element) helptext = element['helpText'];
				else helptext = null;
	
				if (controltype == 'text') {
					validator = element['validator'];
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

function processOldStyleData(dataobj) {
	if (!this.form) {
		form = new OldForm();
		form.createForm();
		this.form = form;
	}
	console.log(dataobj);
	params = dataobj['params'];
	control = params['control'];
	cb = null;
	if (control == 'label') {
		this.form.message(params['text']);
	}
	else if (control == 'text') {
		if (params['password'] == true) {
			cb = this.form.askPassword(params['text'], params['value']);
		}
		else if (params['multiline'] == true) {
			cb = this.form.askMultiline(params['text'], params['value']);
		}
		else {
		cb = this.form.askString(params['text'], params['value']);
		}
	}
	else if (control == 'dropdown') {
		cb = this.form.askDropdown(params['text'], params['values'], params['value']);
	}
	else if (control == 'option') {
		cb = this.form.askChoice(params['text'], params['values'], params['value']);
	}
	else if (control == 'date') {
		cb = this.form.askDate(params['text']);
	}
	else if (control == 'datetime') {
		cb = this.form.askDateTime(params['text']);
	}
	else if (control == 'number') {
		cb = this.form.askInteger(params['text'], params['value']);
	}
	else if (control == 'messagebox') {
		cb = this.form.showMessageBox(params['message'], params['title'], params['msgboxButtons'], params['msgboxIcon'], params['defaultButton'])
	}
	else alert('control type not implemented yet!!');

	if (cb != null) {
		dataobj['callback'] = cb;
	}
}

function processCallback(callbackname) {
	resultdata = save(false);
	callback(this.wizardName, callbackname, JSON.stringify(resultdata), this.sessionId)
}

function getActiveTab(){
	var tabs = $('#form').tabs();
	var selected = tabs.tabs('option', 'selected');
	return this.tabs[selected]['name'];
}

function save(callresult) {
	//if (!this.validated) return;
	if (typeof callresult == 'undefined') callresult = true;
	var resultdata = new Object();
	resultdata['activeTab'] = getActiveTab();
	resultdata['tabs'] = this.tabs;
	tabs = resultdata['tabs'];
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
		callResult(this.sessionId, JSON.stringify(resultdata), success)
	}
	return resultdata;
};

function closeFloatBox(callstop){
	if (callstop) {
		stop(this.sessionId);
	}
	$(".close-floatbox").click();
}

function checkInteger(id) {
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

function next() {
	if (this.dataobj.hasOwnProperty('callback')){
		this.dataobj['result'] = this.dataobj['callback']();
	}
	callResult(this.sessionId, JSON.stringify(this.dataobj), success)
}

function validateRequired(id) {
	obj = $('#' + id);
	val = obj.val();
	if (!val) {
		doError(obj[0], id + ' is a required field');
		return false;
	}
	else doSuccess(obj[0]);
	return true;
}

function validate(validator, id) {
	if (validator != null) {
		obj = $('#' + id);
		val = obj.val();
		var result = val.match(validator);
                if (result) {
			if (result[0] == val){
				doSuccess(obj[0]);
			}
		}
		else {
			doError(obj[0], 'validation error. ' + id + ' should match regex ' + validator + ' ' + val);
		};
	}
}

function doError(obj, message) {
	//console.log('in do error');
	this.validated = false;
    //$('#' + obj.id + '_img').html('<img src="images/exclamation.gif" border="0" style="float:left;" />');
    $('#' + obj.id).addClass("error");
    $('#' + obj.id + '_msg').html(message);
    $('#' + obj.id).removeClass("success");
}

function doSuccess(o) {
	this.validated = true;
   $('#' + o.id).removeClass("error");
   $('#' + o.id + '_msg').html("");
   $('#' + o.id).addClass("success");
}

function createBubblePopup(id, message) {
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


