__tags__   = ('wizard', 'hellowizardname')
__author__ = 'incubaid'

def main(q,i,params,tags):

    form = q.gui.form.createForm()

    # Add tab
    tab = form.addTab('tab_main', 'Hello Wizard!')
    
    # Add textbox
    tab.addText('txt_name', 'What is your name', multiline=False, validator=None, message='Please enter your name', status='', trigger=None, callback=None, helpText='Please enter your name', optional=False)
    result = q.gui.dialog.askForm(form)
    
    form.loadForm(result)
    
    msg = """
Hello %s!

Welcome to the wizard framwork.
    """ % form.tabs['tab_main'].elements['txt_name'].value

    
    form.tabs['tab_main'].removeElement('txt_name')
    form.tabs['tab_main'].message('lbl_hello', msg)
    
    result = q.gui.dialog.askForm(form)

    return
