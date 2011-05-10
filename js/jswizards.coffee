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

    [session, form] = data

    call_ = (command, args_, callback_) ->
      call service, command, args_, callback_

    runWizard session, form, call_

###
Run a single wizard step
###
runWizard = (session, initialAction, call) ->
  handleDisplay = (form, callback) ->
    throw new Error 'Only form controls are supported' if form.control != 'form'

    tabs = form.tabs
    form_ = new Form

    for tab in tabs
      tab_ = form_.addTab tab.name, tab.text

      for control in tab.elements
        tab_.addControl control

    formElement = form_.render()

    backgroundId = "floatbox-background-#{ $.now() }"
    boxId = "floatbox-background-#{ $.now() }"

    formElement.submit (evt) ->
      evt.preventDefault()

      valid = form_.serialize(this, form)

      if not valid
        throw new Error 'Validation failed'

      data =
        tabs: form.tabs
        activeTab: form.tabs[0].name

      args =
        result: JSON.stringify data
        sessionId: session

      outer = this

      call 'result', args, (data, status) ->
        action = $.parseJSON data

        $("#floatbox-box").fadeOut 200, ->
          $("#floatbox-box").remove()

          #TODO Remove background and jqfloatbox-params
          $('#jqfloatbox-params').remove()

          callback action

          $('#floatbox-background')
            .attr('id', '')

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

  initialAction_ = $.parseJSON(initialAction)

  handleAction = (action) ->
    switch action.action
      when 'display' then handleDisplay action.params, handleAction
      when 'endofwizard' then handleEndOfWizard()
      else throw new Error 'Unknown action type'

  handleAction initialAction_


###
Form class
###
class Form
  constructor: ->
    @tabs = []
    @form = null

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
    

  render: ->
    if @form?
      return @form

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

    @form = $('<form>')
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

    @form

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
    throw new Error 'Not implemented'

  serialize: (elem, control) ->
    throw new Error 'Not implemented'

class TextControl extends Control
  render: (container) ->
    $('<label>')
      .attr('for', @data.name)
      .text(@data.text)
      .appendTo container

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

    i

  serialize: (elem, control) ->
    element = $("#{ if @data.multiline then 'textarea' else 'input' }[name=#{ @data.name }]", elem)
    value = element.val()

    #TODO Enhance validation stuff
    if not @data.optional and (not value or value == '')
      element.addClass('error')
      control.value = undefined
  
      return false

    element.removeClass('error')
    control.value = value

    true

class LabelControl extends Control
  render: (container) ->
    l = $('<span>')
      .text(@data.text)
      .appendTo container

    if @data.bold
      l.addClass('jswizards-control-label-bold')

    l

  serialize: (elem, control) ->
    true

class DropDownControl extends Control


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
    $('<label>')
      .attr('for', @data.name)
      .text(@data.text)
      .appendTo container

    date = null
    if @data.value
      date = new Date(@data.value*1000).format(@getformat())
    i = $('<input>')
      .attr('type', 'text')
      .attr('value', date)
      .attr('id', @data.name)
      .attr('name', @data.name)
      .addClass('jswizards-control-input-date')
    i[@type]({ dateFormat: @gettypeformat(), changeYear: true})
      .appendTo container

    if @data.helpText?
      i.attr('placeholder', @data.helpText)

    i

  serialize: (elem, control) ->
    element = $("input[name=#{ @data.name }]", elem)
    value = element.val()

    #TODO Enhance validation stuff
    if not @data.optional and (not value or value == '')
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
    else throw new Error "Unknown control type #{ data.control }"


# Register JSWizards global
(exports ? this).JSWizards =
  launch: launch
