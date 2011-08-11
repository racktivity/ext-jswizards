
def callback_get_click(q,i,params,tags):
    form = q.gui.form.createForm()
    formData = params['formData']
    form.loadForm(formData)
    tb = form.tabs['tab_main']

    txte = form.tabs['tab_main'].elements['txte_name']

    if txte.value != 'ValidText':
        txte.message = 'Error. Please Enter the correct value. Invalid Value: %s' %(txte.value)
        txte.status = 'Error'
    else:
        txte.message = ''
        txte.status = ''
        txte.value = txte.value
        tb.message('msg_name', 'This is a valid text!', bold=True)
        form.tabs['tab_main'].removeElement('btn_name')
    return form

def callback_get_names(q,i,params,tags):
    form = q.gui.form.createForm()
    formData = params['formData']
    form.loadForm(formData)
    ddGrp = form.tabs['tab_main'].elements['dds_name']
    ddEmpl = form.tabs['tab_main'].elements['txtc_name']
 
    if ddGrp.value == 's1':
        ddEmpl.value = 'Mohab'
    if ddGrp.value == 's2':
        ddEmpl.value = 'Jo'
    return form


def main(q,i,params,tags):

    form = q.gui.form.createForm()

    # Add tab
    tab = form.addTab('tab_main', 'Demo Wizard - Login')

    # 1. Add User Name
    tab.addText('u_name', 'User name', multiline=False, validator=None, message='Please enter your name', status='', trigger=None, callback=None, helpText='User name', optional=False)

    # Add Password
    tab.addPassword("pw_name", "Please Enter Password", helpText='Password', optional=False)

    result = q.gui.dialog.askForm(form)

    form.loadForm(result)
    
    username = form.tabs['tab_main'].elements['u_name'].value
    
    # 2. Ask MessageBox
    txt = '%s , Do you want to continue?' %(username)
    result = q.gui.dialog.showMessageBox(txt, 'Continue!', msgboxButtons='YesNo', msgboxIcon='Information', defaultButton='Yes')
    if result == 'No':
        return


    # 3. Inputs Form
    form = q.gui.form.createForm()
    # Add tab
    tab = form.addTab('tab_main', 'Demo Wizard - Inputs')

    # Add Multiline
    tab.addMultiline("mt_name", "Please Enter Multiline text", helpText='Just enter any multiline text')

    # Add Integer
    tab.addInteger("in_name", "Enter a Number", minValue=5, maxValue=60, helpText='Please enter Integer and try to test with invalid number and with max=60 and min=5')

    # Add Date
    tab.addDate("d_name", "Choose a Date", helpText='Choose a date and try to scroll through years and change the month')

    # Add Date Time
    tab.addDateTime("dt_name", "Choose a Date Time",  helpText='Choose a date and try to scroll through years and change the month and try to select a time and play around with AM and PM. This extra part of the help text is here for just testing a very long help text!')

    result = q.gui.dialog.askForm(form)


    # 4. Select Form with Callbacks
    form = q.gui.form.createForm()
    # Add tab
    tab = form.addTab('tab_main', 'Demo Wizard - Selection with Callbacks')
    tab2 = form.addTab('tab_test', 'lozer tab')

    # Add Drop Down
    selval = {"s0":"Select Category Type", "s1":"Software", "s2":"Hardware"}
    tab.addDropDown('dds_name', 'Please Select Category', selval, "s0", helpText='Please Select Category from the Drop Down menu', trigger='change', callback='get_names')
    tab2.addDropDown('dds_name_', 'Please Select Category', selval, "s0", helpText='Please Select Category from the Drop Down menu', trigger='change', callback='get_names')

    # Add textbox
    tab.addText('txtc_name', 'The Employee name is', multiline=False, validator=None, status='', trigger=None, callback=None, helpText='Name of the employee will appear here!', optional=False)

    result = q.gui.dialog.askForm(form)


    # 5. Choices
    form = q.gui.form.createForm()
    # Add tab
    tab = form.addTab('tab_main', 'Demo Wizard - Choice')

    # Add Choice
    selval = {"v0":"selection 0", "v1":"selection 1"}
    tab.addChoice('c_name', 'Please Choose', selval, "v1", helpText='Please choose one value for testing the Choice Control')

    # Add ChoiceMultiple
    selval = {"v0":"selection 0", "v1":"selection 1"}
    tab.addChoiceMultiple('cm_name', 'Please Choose', selval, "v0", helpText='Please choose multiple values for testing the Choice Multiple Control', optional=False)

    # Add YesNo
    tab.addYesNo("yn_name", "Will you answer this question", helpText='Please choose either Yes or No and make sure it appears on the next form after submission')

    result = q.gui.dialog.askForm(form)


    # 6. Button with Callback
    msg = ''
    sts = ''
    while (True):
        form = q.gui.form.createForm()
        # Add tab
        tab = form.addTab('tab_main', 'Demo Wizard - Button with Callback')

        # Add Textbox with Error status
        tab.addText('txte_name', 'Please type "ValidText" and press the button to validate', multiline=False, validator=None, message=msg, status=sts, trigger=None, callback=None, optional=False)

        # Add Button
        tab.addButton('btn_name', 'Validate', trigger='click', callback='get_click')

        result = q.gui.dialog.askForm(form)

        form.loadForm(result)

        if form.tabs['tab_main'].elements['txte_name'].value == 'ValidText':
            break

        msg = 'Error. Please Enter the correct value'
        sts = 'Error'


    # 7. Thank You
    form = q.gui.form.createForm()
    # Add tab
    tab = form.addTab('tab_main', 'Demo Wizard - Thank You')

    txt = '%s, Thank you!' %(username)
    tab.message("tlbl_name", txt, bold=True, multiline=False)

    q.gui.dialog.askForm(form)


    return

    """
    # Add Textbox with Error status
    tab.addText('txte_name', 'What is your name', multiline=False, validator=None, message='Please enter your name', status='Error', trigger=None, callback=None, helpText='Please enter your name (with error!!)', optional=False)

    #Add Filepath
    tab.addFilepath('fp_name', 'What is your name')

    # Add Drop Down
    selval = {"v0":"selection 0", "v1":"selection 1"}
    tab.addDropDown('dd_name', 'Please Select', selval, "v2", helpText='Please Select any value from the Drop Down menu') 

    # Add Choice
    selval = {"v0":"selection 0", "v1":"selection 1"}
    tab.addChoice('c_name', 'Please Choose', selval, "v1", helpText='Please choose one value for testing the Choice Control')

    # Add ChoiceMultiple
    selval = {"v0":"selection 0", "v1":"selection 1"}
    tab.addChoiceMultiple('cm_name', 'Please Choose', selval, "v0", helpText='Please choose multiple values for testing the Choice Multiple Control', optional=False)

    # Add Multiline
    tab.addMultiline("mt_name", "Please Enter Multiline text", helpText='Just enter any multiline text')

    # Add Password
    tab.addPassword("pw_name", "Please Enter Password", helpText='Please enter a password and make sure it doesnt appear after submission on the next form')
   
    # Add YesNo
    tab.addYesNo("yn_name", "Will you answer this question", helpText='Please choose either Yes or No and make sure it appears on the next form after submission') 

    # Add Integer
    tab.addInteger("in_name", "Enter a Number", minValue=5, maxValue=60, helpText='Please enter Integer and try to test with invalid number and with max=60 and min=5')

    #Add Integers
    tab.addIntegers("ins_name", "Enter integers ?!!!!!", helpText='Please enter Integer and try to test with invalid number')

    # Add Date
    tab.addDate("d_name", "Choose a Date", helpText='Choose a date and try to scroll through years and change the month')

    # Add Date Time
    tab.addDateTime("dt_name", "Choose a Date Time",  helpText='Choose a date and try to scroll through years and change the month and try to select a time and play around with AM and PM. This extra part of the help text is here for just testing a very long help text!')

    

    result = q.gui.dialog.askForm(form)
    
    form.loadForm(result)
    

    form.tabs['tab_main'].elements['txt_name'].value

    
    form.tabs['tab_main'].removeElement('txt_name')
    form.tabs['tab_main'].message('lbl_hello', msg)
    
    result = q.gui.dialog.askForm(form)

    return
"""
