$ = jQuery ? alert('JQuery not loaded')
log = (args...) ->
  console?.log?.apply(console, args) if @JSWIZARDS_ENABLE_DEBUG?

###
Launch a new wizard
###
jQuery.jsonp = (options) ->
    fullurl =null
    head = $('head')
    success = null
    error = null
    jsonpcallback = null
    
    detectError = (event, data) ->
      #check if this is our event
      if event.srcElement.src == fullurl
        if error
          return error(null, 'No Details available!', null)
        else
          head.unbind('error', detectError)
    
    errorwrapper = (jqXHR, textStatus, data) ->
      head.unbind('error', detectError)
      #parse our message
      mydata = jqXHR.responseText.trim()
      mydata = mydata.substr(jsonpcallback.length+1, mydata.length-1)
      mydata = $.parseJSON(mydata)
      if error
        return error(jqXHR, mydata.exception)
    
    successwrapper = (data, textStatus, jqXHR) ->
      head.unbind('error', detectError)
      log(data)
      if data and data.error != undefined and data.error
        if options.error != undefined
          jqXHR.status = 500
          jqXHR.statusText = "error"
          if error
            return error(jqXHR, 'error', data)
          else
            return
      if success
          return success(data, textStatus, jqXHR)
    
    beforesendwrapper = (jqXHR, settings) ->
      fullurl = settings.url
      jsonpcallback = settings.jsonpCallback
    
    head.bind('error', detectError)
    #replace options
    options.beforeSend = beforesendwrapper
    success = options.success
    options.success = successwrapper
    error = options.error
    options.error = errorwrapper

    if options.dataType == undefined
      options.dataType = 'jsonp'
    if options.jsonp == undefined
      options.jsonp = 'jsonp_callback'
    if options.cache == undefined
      options.cache = true
    return jQuery.ajax(options)

launch = (service, domain, name, extra, callback) ->
  log "Launching wizard #{ domain }.#{ name } at #{ service }"

  removeEvent()

  call = (service, action, args, callback) ->
    args = args ? {}

    uri = "#{ service }/#{ action }?" + $.param(args)

    $.jsonp
      url: uri
      dataType: 'jsonp'
      jsonp: 'jsonp_callback'
      cache: true # cached uses _ which doesn't work with the appserver
      success: callback
      error: (data, error) ->
        log(data, error)

        e = $("<div>")
          .html("Error Details")
          .addClass("jswizards-error-details")
          .append($("<p>").addClass("jswizards-hide").html(error))

        e.click ->
          p = $("div.jswizards-error-details > p")
          if p.hasClass("jswizards-hide")
            p.removeClass("jswizards-hide").addClass("jswizards-show")
          else
           p.removeClass("jswizards-show").addClass("jswizards-hide")
          true

        $("<div title='Server Error'>")
          .html("The Server Generated an Error!")
          .append(e)
          .dialog
            modal: true
            buttons:
              Ok: ->
                $(this).dialog('close').dialog('destroy')

  args =
    domainName: domain
    wizardName: name

  args.extra = extra if extra?

  call service, 'start', args, (data, status) ->
    log 'Start call returned', data

    [session, formData] = data

    call_ = (command, args_, callback_) ->
      call service, command, args_, callback_

    runWizard session, formData, call_, name, domain

###
Register Remove Event
###
removeEvent = ->
  ev = new $.Event('remove')
  orig = $.fn.remove ->
    $(this).trigger(ev)
    orig.apply(this, arguments)


###
Run a single wizard step
###
wizardForm = null
cleanClose = false

runWizard = (session, initialAction, call, wizardName, domain) ->
  handleDisplay = (formData, callback) ->
    datahandler = DataHandler.create formData, call, callback, session, wizardName, domain
    datahandler.render()
    datahandler.registerSubmit()
    datahandler.display()

  handleEndOfWizard = ->
    # This is an ugly hack
    # Floatbox' API should be fixed. Blergh.
    if $('.floatbox-box').length > 0
      $('.floatbox-box').fadeOut 200, ->

        if $('floatbox-background').length > 0
          $('floatbox-background').fadeOut 200, ->
            $('.floatbox-box').remove()
            $('.floatbox-background').remove()
        else
          $('.floatbox-box').remove()

    else
      $('.floatbox-background').fadeOut 200, ->
        $('.floatbox-background').remove()
    wizardForm = null

  initialAction_ = $.parseJSON(initialAction)

  handleAction = (action) ->
    switch action.action
      when 'display' then handleDisplay action.params, handleAction
      when 'endofwizard' then handleEndOfWizard()
      else throw new Error 'Unknown action type'

  handleAction initialAction_

class DataHandler
  constructor: (@data, @call, @callback, @session, @wizardName, @domain) ->
    @form = null

  render: ->
    @form = @getForm()
    @form.render()

  registerSubmit: () ->
    that = this
    @form.form.submit (evt) ->
      evt.preventDefault()
      $('#jswizards-submit').attr('disabled', 'disabled')
      valid = that.form.serialize(this, that.data)

      if not valid
        throw new Error 'Validation failed'

      data = that.getData()
      args =
        result: JSON.stringify data
        sessionId: that.session

      that.call 'result', args, (data, status) ->
        action = $.parseJSON data
        callback_ = ->
          that.callback action
        that.form.close callback_
      false
   
  display: ->
    #this is a hack because floatbox clone's our object's
    @form.form.clone = -> return this
    cleanClose = false
    $.floatbox
      content: @form.form
      fade: false
      buttonPosition: 'none'

    #Register Remove Event for the floatbox
    that  = this
    $("#floatbox-box").bind "remove", ->
      if cleanClose
        return true
      wizardForm = null
      args =
        sessionId: that.session
      that.call 'stop', args, (data, status) ->
        true

    $("#floatbox-background").addClass('floatbox-background')
    $("#floatbox-box").addClass('floatbox-box')


###
FormDataHandler
###
class FormDataHandler extends DataHandler
  getForm: ->
    @form = new Form this
    tabs = @data.tabs
    for tab in tabs
       tab_ = @form.addTab tab.name, tab.text
       for control in tab.elements
         tab_.addControl control
    return @form

  oncallback: (methodname) ->
    that = this
    valid = @form.serialize(this, @data)

    data = @getData()
    args =
      domainName: @domain
      SessionId: @session
      methodName: methodname
      wizardName: @wizardName
      formData: JSON.stringify data

    @call 'callback', args, (data, status) ->
      log "callback returned", data
      action = $.parseJSON data
      callback_ = ->
        that.callback action
      that.form.close callback_
    false

  getData: ->
    #TODO fix activetab
    data =
      tabs: @data.tabs
      activeTab: @data.tabs[0].name
    data

###
Old Style Wizards
###
class WizardDataHandler extends DataHandler
  getForm: ->
    form = wizardForm
    tab = null
    if not form
      form = new WizardForm
      tab = form.addTab "oldform", "General"
    else
      tab = form.tabs[form.tabs.length-1]
    wizardForm = form
    @data.name = "oldcontrol_#{ $.now() }"
    tab.addControl @data
    @form = form
    @form

  getData: ->
    @data.value


class MessageBoxDataHandler extends DataHandler
  getForm: ->
    that = this
    callback = (data) ->
      args =
        result: JSON.stringify data
        sessionId: that.session

      that.call 'result', args, (data, status) ->
        action = $.parseJSON data
        that.callback action
 
    new MessageBoxForm wizardForm, @data, callback

  getData: ->
    @data.value

  registerSubmit: ->
    null

  display: ->
    null

DataHandler.create = (data, call, callback, session, wizardName, domain) ->
  switch data.control
    when 'form' then new FormDataHandler data, call, callback, session, wizardName, domain
    when 'messagebox' then new MessageBoxDataHandler data, call, callback, session
    else new WizardDataHandler data, call, callback, session


###
Form class
###
class Form
  constructor: (@datahandler) ->
    @tabs = []
    @form = null

  addTab: (name, text) ->
    tab = new Tab name, text, this
    @tabs.push tab

    tab

  serialize: (elem, form) ->
    valid = true

    for tab in @tabs
      tab_ = _tab = null

      tabs = form.tabs
      for _tab in tabs
        if _tab.name == tab.name
          tab_ = _tab

      throw new Error 'Tab not found' if not tab_?
      valid &= tab.serialize elem, tab_

    valid
    

  close: (callback) ->
    cleanClose = true
    $("#floatbox-box").remove()
    $('#jqfloatbox-params').remove()
    $('#floatbox-background').remove()
    callback()


  render: ->
    content = $('<div>')
      .addClass 'jswizards-form'

    tabsPanel = $('<ul>')
      .addClass 'jswizards-tabs'

    content.append(tabsPanel)

    for tab in @tabs
      tabsPanel.append(
        $('<li>').append(
          $('<a>')
            .attr('href', "#tab-#{ tab.name }")
            .append(
              $('<span>')
                .text(tab.text)
            )
          )
        )

      content.append(
        tab.render()
          .attr('id', "tab-#{ tab.name }")
          .addClass 'jswizards-tab'
        )

    content.tabs()

    form = $('<form>')
      .append(content)
      .append(
        $('<div>')
          .addClass('jswizards-form-buttons')
          .append(
            $('<button>')
              .attr('type', 'submit')
              .attr('id', 'jswizards-submit')
              .addClass('button positive')
              .text('Submit')
            )
          .append(
            $('<button>')
              .text('Cancel')
              .attr('type', 'button')
              .attr('name', 'btn_cancel')
              .addClass('close-floatbox button negative')
              .click (evt) ->
                evt.preventDefault()
                false
            )
        )

    @form = form
    form


class MessageBoxForm extends Form
  constructor: (@form, @data, @callback) ->
    null

  render: ->
    buttons = []
    that = this
    switch @data.msgboxButtons
      when 'OKCancel' then buttons = ['Ok', 'Cancel' ]
      when 'YesNo' then buttons = ['Yes', 'No' ]
      when 'YesNoCancel' then buttons = ['Yes', 'No', 'Cancel' ]
      else buttons = ['Ok']
    buttonoptions = []
    $.each buttons, (index, button) ->
      option =
        text: button
        click: ->
          $(this).dialog "close"
          $(this).dialog "destroy"
          that.callback(button)
      buttonoptions.push option

    iconspaths =
      Information: '/static/jswizards/icons/information.png'
      Error: '/static/jswizards/icons/error.png'
      Warning: '/static/jswizards/icons/warning.png'
      Question: '/static/jswizards/icons/question.png'
    $("<div>")
      .dialog
        buttons: buttonoptions
        modal: true
        title: @data.title
      .append($("img").attr("src", iconspaths[@data.msgboxIcon]).attr("align", 'left'))
      .append(@data.message)
    @form
  
  serialize: ->
    true


###
OldForm Class
###
class WizardForm extends Form
  
  serialize: (elem, controldata) ->
    tab = @tabs[@tabs.length-1]
    control = tab.controls[tab.controls.length-1]
    return control.serialize elem, controldata
  

###
Tab class
###
class Tab
  constructor: (@name, @text, @form) ->
    @controls = []

  addControl: (control) ->
    @controls.push Control.create control, this

  serialize: (elem, tab) ->
    valid = true

    for control in @controls
      control_ = _control = null

      controls = tab.elements
      for _control in controls
        if _control.name == control.data.name
          control_ = _control

      throw new Error 'Control not found' if not control_?
      valid &= control.serialize elem, control_

    valid

  render: ->
    content = $('<div>')

    for control in @controls
      controlContainer = $('<div>')
        .addClass('jswizards-control')
        .addClass("jswizards-control-#{ control.control }")

      control.render controlContainer
      content.append controlContainer

    content

###
Abstract form control class
###
class Control
  constructor: (@data, @tab) ->
    @control = data.control

  render: (container) ->
    l = $('<label>')
      .attr('for', @data.name)
      .text(@data.text)
    if not @data.optional
      l.append $('<span>').text('*').attr('style','color:red; margin-left:2px;')
    container.append l
    if @data.status? and @data.message? and @data.status == 'Error'
      e = $('<span>')
        .html(@data.message)
        .addClass('jswizards-control-error')
        .addClass('error')
      container.append e

   addCallback: (element) ->
     that = this
     if @data.callback? and @data.trigger?
       if @data.trigger == 'change'
         element.change(-> that.tab.form.datahandler.oncallback(that.data.callback))
       else if @data.trigger == 'click'
         element.click(-> that.tab.form.datahandler.oncallback(that.data.callback))
     true
     
  serialize: (elem, control) ->
    throw new Error 'Not implemented'

  validateOptional: (value) ->
    if not @data.optional and (not value or value == '' or ($.isArray(value) and value.length <= 0))
      return false
    true  

  #Validates Number (Integer)
  validateNumber: (value) ->
    if value? and @data.control == 'number' and value isnt ""
      return value.toString().search(/^-?[0-9]+$/) == 0
    true

  validateMinMax: (value) ->
    if @data.control == 'number' and @data.minvalue? and @data.maxvalue? and value isnt "" and value?
      if value < parseInt(@data.minvalue) or value > parseInt(@data.maxvalue)
        return false
    true

  checkValidator: (value) ->
    if @data.validator? and value isnt "" and value?
      return value.search(@data.validator) == 0
    true

  #Help Text
  addHelpText: (container) ->
    if @data.helpText?
      container.append $('<span>').html(@data.helpText).addClass('jswizards-control-helptext')
    true

###
Text Control Class
###
class TextControl extends Control
  render: (container) ->
    super

    if not @data.multiline
      i = $('<input>')
        .attr('type', if not @data.password then 'text' else 'password')
    else
      i = $('<textarea>')

    i.attr('id', @data.name)
      .addClass('text')
      .appendTo container

    @addCallback i

    if @data.helpText?
      i.attr('placeholder', @data.helpText)

    if @data.value? and @data.multiline
      i.html(@data.value)
    else if @data.value? and not @data.password
      i.attr('value', @data.value)
  
    i

  serialize: (elem, control) ->
    element = $("##{ @data.name }")
    value = element.val()

    #TODO Enhance validation stuff
    if not @validateOptional value
      element.addClass('error')
      control.value = null
      return false
    else if  not @checkValidator value
      element.addClass('error')
      control.value = null
      return false
    else if not @validateNumber value 
      element.addClass('error')
      control.value = null
      return false
    else if not @validateMinMax value
      element.addClass('error')
      control.value = null
      return false
    
    element.removeClass('error')
    control.value = if @data.control=='number' then parseInt(value) else value

    true


###
Label Control
###
class LabelControl extends Control
  render: (container) ->
    l = $('<label>')
      .text(@data.text)
      .appendTo container

  serialize: (elem, control) ->
    true

###
Drop Down Control
###
class DropDownControl extends Control
  render: (container) ->
    super

    @addHelpText container

    i = $('<select>')
      .attr('id', @data.name)
      .addClass('jswizards-control-select')

    @addCallback i

    sel = @data.value
    oldval = @data.selvalue if @data.selvalue

    for k, v of @data.values
      o = $('<option>')
        .attr('value', k)
        .text(v)

      if sel == k
        o.attr('selected','selected')

      o.appendTo i

    i.appendTo container

    i

  serialize: (elem, control) ->
    control.value = $("##{ @data.name }").val()
    true

###
Choice Control
###
class ChoiceControl extends Control
  render: (container) ->
    super

    @addHelpText container

    i = $('<div>')

    optname = @data.name
    optsel = @data.value or @data.selectedvalue

    for k, v of @data.values
      o = $('<input>')
        .attr('type', 'radio')
        .attr('name', optname)
        .attr('value', JSON.stringify v[1])
      
      if optsel == v[1]
        o.attr('checked','checked')
      
      $('<div>')
        .append(o)
        .append(v[0])
        .appendTo(i)
  
    @addCallback i

    i.appendTo container

    i

  serialize: (elem, control) ->
    value = $("input[name=#{ @data.name }]:checked", elem).val()
    if value
      control.value  = JSON.parse value
    else
      control.value = null 

    true

###
Choice Mulitple Control
###
class ChoiceMultipleControl extends Control
  render: (container) ->
    super

    @addHelpText container

    i = $('<div>')
      .attr('for', @data.name)

    optname = @data.name
    optsel = @data.value

    for k, v of @data.values
      o = $('<input>')
        .attr('type', 'checkbox')
        .attr('name', optname)
        .attr('value', k)
      if $.isArray optsel
        if $.inArray(k, optsel) != -1
          o.attr('checked','checked')
      else if optsel == k
        o.attr('checked','checked')
      
      $('<div>')
        .append(o)
        .append(v)
        .appendTo(i)

    @addCallback i

    i.appendTo container

    i

  serialize: (elem, control) ->
    element = $("div[htmlfor=#{ @data.name }]")
    value = new Array()
    $("input[name=#{ @data.name }]:checked").each ->
      value.push $(this).val()
      true

    #Validation goes here !!
    if not @validateOptional value
      element.addClass('error')
      control.value = null
      return false

    element.removeClass('error')
    control.value = value

    true


###
Button Control
###
class ButtonControl extends Control
  render: (container) ->    
    i = $("<button type='button'>") #JQuery refused to add attr "type", and the default is "Submit", which is totally Wrong!!!!
      .attr("id", @data.name)
      .html(@data.label)

    @addCallback i

    @addHelpText container

    container.append i

  serialize: (elem, control) ->
    true

###
ProgressControl
###
class ProgressControl extends Control
  render: (container) ->
    
    i = $("<div>")
      .attr("id",@data.name)
      .progressbar({value:@data.value})

    container.append i
    
  serialize: (elem, control) ->
    true


###
DateHelper
###
class DateHelper extends Control

  getFormat: ->
    #wizards do format is not compatible with javasript one
    format = @data.format.replace(/Y/g, "y")
      .replace(/M/g, "\0")
      .replace(/m/g, "M")
      .replace(/\0/g, "m")
      .replace(/D/g, "d")
      .replace(/h/g, "H")
    return format

  getTypeFormat: ->
    return @getFormat()

  getType: ->
    throw new Error 'Not implemented' 

  render: (container) ->
    super

    @addHelpText container

    date = null
    if @data.value
      date = new Date(@data.value*1000).format(@getFormat())
    i = $('<input>')
      .attr('type', 'text')
      .attr('value', date)
      .attr('id', @data.name)
      .attr('name', @data.name)
      .addClass('jswizards-control-input-date')
    options = { dateFormat: @getTypeFormat(), changeYear: true }

    @addCallback i

    if @data.minvalue
      options['minDate'] = new Date(@data.minvalue*1000)
    if @data.maxvalue
      options['maxDate'] = new Date(@data.maxvalue*1000)
    i[@getType()](options)
      .appendTo container

    i

  serialize: (elem, control) ->
    element = $("input[name=#{ @data.name }]", elem)
    value = element.val()

    #TODO Enhance validation stuff
    if not @validateOptional value
      element.addClass('error')
      control.value = null
  
      return false

    value = new Date(value).getTime()/1000
    element.removeClass('error')
    control.value = value

    true

class DateTimeControl extends DateHelper

  getType: ->
    return 'datetimepicker'

class DateControl extends DateHelper

  getType: ->
    return 'datepicker'

  getTypeFormat: ->
    format = super
    return format.replace("yyyy", "yy")

Control.create = (data, tab) ->
  switch data.control
    when 'text' then new TextControl data, tab
    when 'label' then new LabelControl data, tab
    when 'dropdown' then new DropDownControl data, tab
    when 'datetime' then new DateTimeControl data, tab
    when 'date' then new DateControl data, tab
    when 'option' then new ChoiceControl data, tab
    when 'optionmultiple' then new ChoiceMultipleControl data, tab
    when 'number' then new TextControl data, tab
    when 'button' then new ButtonControl data, tab
    when 'progress' then new ProgressControl data, tab
    when 'multiline'
      data.multiline = true
      new TextControl data, tab
    else throw new Error 'Unknown control type: ' + data.control


# Register JSWizards global
(exports ? this).JSWizards =
  launch: launch
