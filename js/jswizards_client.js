function callAppserver(wizardurl, success, methodName) {
          jQuery.ajax({url: wizardurl,
            dataType: 'jsonp',
            success: success,
            jsonp: 'jsonp_callback',
            cache: true,
            error: function(data, error) { alert(data + error); }
          });
    };
    
function start(customerGuid, wizardName, applicationserverIp, success) {
	this.applicationserverIp = applicationserverIp;
	this.wizardName = wizardName;
	url = "http://"+applicationserverIp+"/appserver/rest/wizard_engine/start?customerGuid="+customerGuid+"&wizardName="+wizardName;
	//callAppserver(url, success, 'start');
    jQuery.ajax({url: url,
	    dataType: 'jsonp',
	    success: success,
	    jsonp: 'jsonp_callback',
	    cache: true,
	    error: function(data, error) { alert(data + error); }
	});

}

function result(sessionId, resultData, applicationserverIp, success) {
	url = "http://"+applicationserverIp+"/appserver/rest/wizard_engine/result?sessionId="+sessionId+"&result="+resultData;
	//callAppserver(url, success, 'result');
    jQuery.ajax({url: url,
	    dataType: 'jsonp',
	    success: success,
	    jsonp: 'jsonp_callback',
	    cache: true,
	    error: function(data, error) { alert(data + error); }
	});
}

function callback(wizardName, methodName, formData, sessionId, applicationserverIp){
	url = "http://"+applicationserverIp+"/appserver/rest/wizard_engine/callback?SessionId="+sessionId+"&wizardName="+wizardName
	+"&methodName="+methodName+"&formData="+formData;
    jQuery.ajax({url: url,
	    dataType: 'jsonp',
	    success: success,
	    jsonp: 'jsonp_callback',
	    cache: true,
	    error: function(data, error) { alert(data + error); }
	});
}

function stop(sessionId, applicationserverIp) {
	url = "http://" + applicationserverIp + "/appserver/rest/wizard_engine/stop?sessionId=" + sessionId;
    jQuery.ajax({url: url,
	    dataType: 'jsonp',
	    jsonp: 'jsonp_callback',
	    cache: true,
	});
}

var success = function(data, status){
            if (!data){
                alert("No data returned!!");
            }
            else {
            	//alert(data);
            	processData(data);
            }
        }

function processData(jsondata) {
	if (jsondata[0] != '{') {
			this.sessionId = jsondata[0];
			this.dataobj = JSON.parse(jsondata[1]);
	}
	else {
		this.dataobj = JSON.parse(jsondata);
	}
	try{
		this.tabs = this.dataobj['params']['tabs'];
	}
	catch (err) {
		console.log(err);
	}
	if (dataobj.hasOwnProperty('action') && dataobj.action == 'endofwizard') {
		closeFloatBox(false);
		return;
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

			if (controltype == 'text') {
				if (password == true) {
					form.addPassword(tabid, elementname, elementtext, value, optional, callbackname);
				}
				else if (element['multiline'] == true) {
					form.addMultiline(tabid, elementname, elementtext, value, optional, callbackname);
				}
				else form.addText(tabid, elementname, elementtext, value, optional, callbackname);
			}
			else if (controltype == 'integer') {
				form.addInteger(tabid, elementname, elementtext, value, optional, callbackname);
			}
			else if (controltype == 'option') {
				form.addChoice(tabid, elementname, elementtext, element['values'], value, optional, callbackname);
			}
			else if (controltype == 'optionmultiple') {
				form.addChoiceMultiple(tabid, elementname, elementtext, element['values'], value, optional, callbackname);
			}
			else if (controltype == 'label') {
				form.message(tabid, elementname, elementtext, element['bold'], element['multiline']);
			}
			else if (controltype == 'dropdown') {
				form.addDropDown(tabid, elementname, elementtext, element['values'], value, optional, callbackname);
			}
			else if (controltype == 'number') {
				form.addInteger(tabid, elementname, elementtext, value, optional, callbackname);
			}
			else if (controltype == 'date') {
				form.addDate(tabid, elementname, elementtext, element['minValue'], element['maxValue'], value, callbackname);
			}
			else if (controltype == 'datetime') {
				form.addDateTime(tabid, elementname, elementtext, element['minValue'], element['maxValue'], value, callbackname);
			}
			else {
				alert('control type not defined or not implemented yet !!');
			}
		};
	}
	form.finalize();
}

function processCallback(callbackname) {
	resultdata = save(false);
	callback(this.wizardName, callbackname, JSON.stringify(resultdata), this.sessionId, this.applicationserverIp)
}

function getActiveTab(){
	var tabs = $('#form').tabs();
	var selected = tabs.tabs('option', 'selected');
	return this.tabs[selected]['name'];
}

function save(callresult) {
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
		result(this.sessionId, JSON.stringify(resultdata), this.applicationserverIp, success)
	}
	return resultdata;
};

function closeFloatBox(callstop){
	if (callstop) {
		stop(this.sessionId, this.applicationserverIp);
	}
	$(".close-floatbox").click();
}

function allowNumbersOnly(evt, minvalue, maxvalue)
      {
         var charCode = (evt.which) ? evt.which : event.keyCode
         if (charCode > minvalue && charCode < maxvalue)
            return true;

         return false;
      }



