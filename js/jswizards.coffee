$ = jQuery ? alert('JQuery not loaded')
log = (args...) ->
  console?.log?.apply(console, args) if @JSWIZARDS_ENABLE_DEBUG?

###
Launch a new wizard
###

launch = (service, domain, name, extra, callback) ->
  log "Launching wizard #{ domain }.#{ name } at #{ service }"

  call = (service, action, args, callback) ->
    args = args ? {}

    uri = "#{ service }/#{ action }?" + $.param(args)

    $.ajax
      url: uri
      dataType: 'jsonp'
      jsonp: 'jsonp_callback'
      cache: true # cached uses _ which doesn't work with the appserver
      success: callback
      ###
      Error handing is not supported when using JSONP
    
      error: (data, error) ->
        log(data, error)
        $("<div title='error'>Error during XHR request:<p>#{ error }</p>")
          dialog
            modal: true
            buttons:
              Ok: ->
                $(this) dialog('close') dialog('destroy')
      ###

  args =
    domainName: domain
    wizardName: name

  args.extra = extra if extra?

  call service, 'start', args, (data, status) ->
    log 'Start call returned', data

    [session, formData] = data

    call_ = (command, args_, callback_) ->
      call service, command, args_, callback_

    runWizard session, formData, call_

###
Run a single wizard step
###

wizardForm = null

runWizard = (session, initialAction, call) ->
  handleDisplay = (formData, callback) ->
    datahandler = DataHandler.create formData
    form = datahandler.getForm()
    formElement = form.render()

    backgroundId = "floatbox-background-#{ $.now() }"
    boxId = "floatbox-background-#{ $.now() }"

    formElement.submit (evt) ->
      evt.preventDefault()

      valid = form.serialize(this, formData)

      if not valid
        throw new Error 'Validation failed'

      data = datahandler.getData()
      args =
        result: JSON.stringify data
        sessionId: session

      outer = this

      call 'result', args, (data, status) ->
        action = $.parseJSON data
        callback_ = ->
          callback action
        form.close callback_
      false

    #this is a hack because floatbox clone's our object's
    formElement.clone = -> return this

    $.floatbox
      content: formElement
      fade: true
      buttonPosition: 'none'

    $("#floatbox-background").addClass('floatbox-background')
    $("#floatbox-box").addClass('floatbox-box')

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
  constructor: (@data) ->
    @form = null

class FormDataHandler extends DataHandler
  getForm: ->
    @form = new Form
    tabs = @data.tabs

    for tab in tabs
       tab_ = @form.addTab tab.name, tab.text
       for control in tab.elements
         tab_.addControl control
    return @form

  getData: ->
    #TODO fix activetab
    data =
      tabs: @data.tabs
      activeTab: @data.tabs[0].name
    data


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

DataHandler.create = (data) ->
  switch data.control
    when 'form' then new FormDataHandler data
    else new WizardDataHandler data



###
Form class
###
class Form
  constructor: ->
    @tabs = []

  addTab: (name, text) ->
    tab = new Tab name, text
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
    $("#floatbox-box").fadeOut 200, ->
      $("#floatbox-box").remove()
      #TODO Remove background and jqfloatbox-params
      $('#jqfloatbox-params').remove()
      callback()
      $('#floatbox-background').attr('id', '')


  render: ->
    #if @form?
    #  return @form

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

    form

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
  constructor: (@name, @text) ->
    @controls = []

  addControl: (control) ->
    @controls.push Control.create control

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
  constructor: (@data) ->
    @control = data.control

  render: (container) ->
    l = $('<label>')
      .attr('for', @data.name)
      .text(@data.text)
    if not @data.optional
      l.append $('<span>').text('*').attr('style','color:red; margin-left:2px;')
    container.append l
    if @data.status? and @data.message?
      e = $('<span>')
        .html(@data.message)
        .addClass('jswizards-control-error')
        .addClass('error')
      container.append e

  serialize: (elem, control) ->
    throw new Error 'Not implemented'

  #Validates Optional, takes only value, Error response left for the caller (Error CSS, etc...)
  validateOptional: (value) ->
    if not @data.optional and (not value or value == '' or ($.isArray(value) and value.length <= 0))
      return false
    true  

  #Validates Number (Integer)
  validateNumber: (value) ->
    if value
      return value.toString().search(/^-?[0-9]+$/) == 0
    true

  validateMaxMin: (value, max, min) ->
    if value isnt ""
      if parseInt(value)<parseInt(min) or parseInt(value)>parseInt(max)
        return false
    true

  validator: (value, validator) ->
    if value isnt ""
      return value.search(validator) == 0
    true

  #Help Text
  addHelpText: (message, container) ->
    container.append $('<span>').html(message).addClass('jswizards-control-helptext')
    true

  #Add Status Error
  addStatus: (container) ->

###
Text Control Class
###
class TextControl extends Control
  render: (container) ->
    super

    @addStatus container

    if not @data.multiline
      i = $('<input>')
        .attr('type', if not @data.password then 'text' else 'password')
    else
      i = $('<textarea>')

    i.attr('name', @data.name)
      .addClass('text')
      .appendTo container

    if @data.helpText?
      i.attr('placeholder', @data.helpText)

    if @data.value? and @data.multiline
      i.html(@data.value)
    else if @data.value? and not @data.password
      i.attr('value', @data.value)
    
    i

  serialize: (elem, control) ->
    element = $("#{ if @data.multiline then 'textarea' else 'input' }[name=#{ @data.name }]", elem)
    value = element.val()

    #TODO Enhance validation stuff
    if not @validateOptional value
      element.addClass('error')
      control.value = undefined
      return false
    else if @data.validator? and not @validator value, @data.validator
      element.addClass('error')
      control.value = undefined
      return false
    
    element.removeClass('error')
    control.value = value

    true


###
Number Control
###
class NumberControl extends Control
  render: (container) ->
    super

    i = $('<input>')
      .attr('type', 'text')
      .attr('name', @data.name)
      .addClass('text')
      .appendTo container

    if @data.helpText?
      i.attr('placeholder', @data.helpText)

    if @data.value
      i.attr('value', @data.value)

    i

  serialize: (elem, control) ->
    element = $("input[name=#{ @data.name }]", elem)
    value = element.val()

    #Validation goes here !!
    if not @validateOptional(value)
      element.addClass('error')
      control.value = undefined
      return false
    else if not @validateNumber(value)
      element.addClass('error')
      control.value = undefined
      return false
    else if not @validateMaxMin value, @data.maxvalue, @data.minvalue
      element.addClass('error')
      control.value = undefined
      return false

    element.removeClass('error')
    control.value = value

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

    if @data.helpText?
      @addHelpText @data.helpText, container

    i = $('<select>')
      .attr('id', @data.name)
      .addClass('jswizards-control-select')

    sel = @data.value
    oldval = @data.selvalue if @data.selvalue

    indx = 0
    $.each @data.values, (k, v) ->
      o = $('<option>')
        .attr('value', v)
        .text(k)

      if sel == v
        o.attr('selected','selected')

      indx = indx + 1
      o.appendTo i

    i.appendTo container

    i

  serialize: (elem, control) ->
    control.value = $("select[id=#{ @data.name }]", elem).val()
    true

###
Choice Control
###
class ChoiceControl extends Control
  render: (container) ->
    super

    if @data.helpText?
      @addHelpText @data.helpText, container

    i = $('<div>')

    optname = @data.name
    optsel = @data.value
    #oldval = @data.selvalue if @data.selvalue != undefined

    indx = 0
    $.each @data.values, (k, v) ->
      cont = $('<div>')
      o = $('<input>')
        .attr('type', 'radio')
        .attr('name', optname)
        .attr('value', JSON.stringify v[1])
      
      if optsel == v[1]
        o.attr('checked','checked')
      indx = indx + 1
      
      o.appendTo cont
      cont.append v[0]
      cont.appendTo i

    i.appendTo container

    i  

  serialize: (elem, control) ->
    value = $("input[name=#{ @data.name }]:checked", elem).val()
    if value
      control.value  = JSON.parse value
    else
      control.value = undefined 

    true

###
Choice Mulitple Control
###
class ChoiceMultipleControl extends Control
  render: (container) ->
    super

    if @data.helpText?
      @addHelpText @data.helpText, container

    i = $('<div>')
      .attr('for', @data.name)

    optname = @data.name
    optsel = @data.value

    indx = 0
    $.each @data.values, (k, v) ->
      cont = $('<div>')
      o = $('<input>')
        .attr('type', 'checkbox')
        .attr('name', optname)
        .attr('value', k)
      if $.isArray optsel
        if $.inArray(k, optsel) != -1
          o.attr('checked','checked')
      else if optsel == k
        o.attr('checked','checked')
      indx = indx + 1
      
      o.appendTo cont
      cont.append v
      cont.appendTo i

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
      control.value = undefined
      return false

    element.removeClass('error')
    control.value = value

    true


class DateHelper extends Control
  constructor: (@data) ->
    @control = data.control
    @type = null
    $("<div>").datetimepicker()

  getformat: ->
    #wizards do format is not compatible with javasript one
    format = @data.format.replace(/Y/g, "y")
      .replace(/M/g, "\0")
      .replace(/m/g, "M")
      .replace(/\0/g, "m")
      .replace(/D/g, "d")
      .replace(/h/g, "H")
    return format

  gettypeformat: ->
    return @getformat()

  render: (container) ->
    super

    if @data.helpText?
      @addHelpText @data.helpText, container

    date = null
    if @data.value
      date = new Date(@data.value*1000).format(@getformat())
    i = $('<input>')
      .attr('type', 'text')
      .attr('value', date)
      .attr('id', @data.name)
      .attr('name', @data.name)
      .addClass('jswizards-control-input-date')
    options = { dateFormat: @gettypeformat(), changeYear: true }
    if @data.minvalue
      options['minDate'] = new Date(@data.minvalue*1000)
    if @data.maxvalue
      options['maxDate'] = new Date(@data.maxvalue*1000)
    i[@type](options)
      .appendTo container

    i

  serialize: (elem, control) ->
    element = $("input[name=#{ @data.name }]", elem)
    value = element.val()

    #TODO Enhance validation stuff
    if not @validateOptional value
      element.addClass('error')
      control.value = undefined
  
      return false

    value = new Date(value).getTime()/1000
    element.removeClass('error')
    control.value = value

    true

class DateTimeControl extends DateHelper
  constructor: (@data) ->
    @control = data.control
    @type = 'datetimepicker'

class DateControl extends DateHelper
  constructor: (@data) ->
    @control = data.control
    @type = 'datepicker'

  gettypeformat: ->
    format = super
    return format.replace("yyyy", "yy")

Control.create = (data) ->
  switch data.control
    when 'text' then new TextControl data
    when 'label' then new LabelControl data
    when 'dropdown' then new DropDownControl data
    when 'datetime' then new DateTimeControl data
    when 'date' then new DateControl data
    when 'option' then new ChoiceControl data
    when 'optionmultiple' then new ChoiceMultipleControl data
    when 'number' then new NumberControl data
    when 'multiline'
      data.multiline = true
      new TextControl data
    else throw new Error 'Unknown control type: ' + data.control


# Register JSWizards global
(exports ? this).JSWizards =
  launch: launch
