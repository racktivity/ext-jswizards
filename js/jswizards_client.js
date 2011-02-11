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
				if (password == false) {
					form.addText(tabid, elementname, elementtext, value, optional, callbackname);
				}
				else {
					form.addPassword(tabid, elementname, elementtext, value, optional, callbackname);
				}
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
			//console.log(id);
			controltype = element['control'];
			if (controltype == 'text' || controltype == 'password') {
				element['value'] = $('#' + id).val();
			}
			else if (controltype == 'option' || controltype == 'optionmultiple') {
				v =  $("input[name="+id+"]:checked").val();
	
				console.log($("input[name="+id+"]:checked")[0].id);
				element['value'] = $("input[name="+ id +"]:checked")[0].id;
				//console.log('*********'+element['value']);
			}
		}
	}
	//console.log(resultdata);
	if (callresult == true){
		result(this.sessionId, JSON.stringify(resultdata), this.applicationserverIp, success)
	}
	return resultdata;
};

function closeFloatBox(){
	stop(this.sessionId, this.applicationserverIp);
	window.location = "javascript:void(0)";
}
