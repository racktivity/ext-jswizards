__tags__   = ('wizard', 'hellowizard')
__author__ = 'incubaid'

def main(q,i,params,tags):
   
    msg = """
Hello Wizard!

Welcome to the wizard framwork.
    """ 
    form = q.gui.form.createForm()

    # Add tab
    tab = form.addTab('tab_main', 'Hello Wizard!')
    # Add a label
    tab.message('lbl_hello', msg)
   
    result = q.gui.dialog.askForm(form)

    return
