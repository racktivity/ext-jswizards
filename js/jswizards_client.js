function callAppserver(customerGuid, wizardName, applicationserver_ip, success) {
          jQuery.ajax({url: "http://"+applicationserver_ip+"/appserver/rest/wizard_engine/start?customerGuid="+customerGuid+"&wizardName="+wizardName,
            dataType: 'jsonp',
            success: success,
            jsonp: 'jsonp_callback',
            cache: true,
            error: function(data, error) { alert(data + error); }
          });
    };
    
var success = function(data, status){
            if (!data){
                alert("No data returned!!");
            }
            else {
                alert("Data returned: " + data);
                processData(data);
            }
        }
        
function processData(jsondata) {
	var dataobj = JSON.parse(jsondata[1]);
	console.log(dataobj);
	
	form = new Form();
	form.createForm();
	var tabs = dataobj['params']['tabs'];
	for (tabindex in tabs) {
		form.addTab(tabs[tabindex]['text'], tabs[tabindex]['name']);
		elements = tabs[tabindex]['elements'];
		tabid = tabs[tabindex]['name'];
		for (elementindex in elements) {
			element = elements[elementindex];
			elementname = element['name'];
			elementtext = element['text'];
			controltype = element['control'];
			password = element['password'];
			if (controltype == 'text') {
				if (password == false) {
					form.addText(tabid, elementname, elementtext);
				}
				else {
					form.addPassword(tabid, elementname, elementtext);
				}
			}
			else if (controltype == 'option') {
				form.addChoice(tabid, elementname, elementtext, element['values']);
			}
			else if (controltype == 'optionmultiple') {
				form.addChoiceMultiple(tabid, elementname, elementtext, element['values']);
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
