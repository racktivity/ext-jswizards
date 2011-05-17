def main(q, i, p, params, tags):
    ###########################
    q.gui.dialog.message("This is a test wizard, please enter the asked values unless the default is wrong")

    m = q.gui.dialog.message

    question = "Please enter '%(expected)s' default [%(default)s], answer false if default mismatch"
    
    opts = dict()

    class Results:
        def __init__(self, value):
            self.value = value

        def __eq__(self, other):
            return set(self.value) == set(other)

        def __ne__(self, other):
            return not self.__eq__(other)

        def __str__(self):
            return str(self.value)

    testcases = [ 
                  { 'method' : q.gui.dialog.askString,
                    'kwargs' : {'defaultValue': "this is a pylabs tes"},
                    'default': 'this is a pylabs tes',
                    'expected' : 'this is a pylabs test'
                    },

                  { 'method' : q.gui.dialog.askChoiceMultiple,
                    'kwargs' : {"choices": { '1': 'een', '2': 'twee', '3': 'drie', '4': 'view'}, "defaultValue" :'2'},
                    'default': '2',
                    'expected' : Results(['1', '3'])
                    },
                  { 'method' : q.gui.dialog.askYesNo,
                    'kwargs' : {'defaultValue': False},
                    'default': False,
                    'expected' : True
                    },
                  { 'method' : q.gui.dialog.askChoice,
                    'kwargs' : {'choices': [ 'i am default', 'you should pick me', 'i dont matter' ], 'defaultValue': 'i am default'},
                    'default': 'you should pick me',
                    'expected' : 'you should pick me'
                    },
                  { 'method' : q.gui.dialog.askInteger,
                    'kwargs' : {'defaultValue': 12345678},
                    'default': 12345678,
                    'expected' : 123456789
                    },
                ]
    
    for testcase in testcases:
        result = testcase['method'](question % testcase, **testcase['kwargs'])
        if result != testcase['expected']:
            q.gui.dialog.message("Got wrong result got '%s' was expecting %s" % (result, testcase['expected']));return;
    
    q.gui.dialog.showProgress(minvalue=0, maxvalue=100, currentvalue=70)

    q.gui.dialog.askDate("Select Date: ")
    q.gui.dialog.askDateTime("Select DateTime: ")
    q.gui.dialog.askMultiline("Enter Multiline: ")


    #q.gui.dialog.showLogging(
    #q.gui.dialog.askInteger(         
    #q.gui.dialog.chooseDialogType(   
    #q.gui.dialog.showMessageBox(
    #q.gui.dialog.askDate(            
    #q.gui.dialog.askIntegers(        
    #q.gui.dialog.clear(              
    #q.gui.dialog.showProgress(
    #q.gui.dialog.askDateTime(        
    #q.gui.dialog.askMultiline(       
    #q.gui.dialog.askDirPath(         
    #q.gui.dialog.askPassword(        
    #q.gui.dialog.message(            
    #q.gui.dialog.askFilePath(        
    #q.gui.dialog.navigateTo(         
    
