$ = jQuery ? alert('JQuery not loaded')
log = (args...) ->
  console?.log?.apply(console, args) if @JSWIZARDS_ENABLE_DEBUG?

###
Make button names changeable
###
ButtonValues =
  cancel: 'Cancel'
  submit: 'Submit'
  ok: 'Ok'
  yes: 'Yes'
  no: 'No'
  next: 'Next'
  previous: 'Previous'

getButtons = (extra) ->
  ButtonNames =
    cancel: 'Cancel'
    submit: 'Submit'
    ok: 'OK'
    yes: 'Yes'
    no: 'No'
    next: 'Next'
    previous: 'Previous'

  if (typeof(extra) == 'string')
    extra = $.parseJSON(extra)

  if (extra &&  extra.language)
    ButtonNames = $.extend(ButtonNames,extra.language);

  return ButtonNames
###
Check if inner navi should be shown for multiple tab. default - false
###
getInnerNavi = (extra) ->
  if (typeof extra == 'string')
    extra = $.parseJSON(extra);

  if (extra && extra.innernavi)
    return true;
  else
    return false;

###
Launch a new wizard
###
usesdomain = true
launch = (service, domain, name, extra, callback, cancelCallback, refresh=false) ->
  log "Launching wizard #{ domain }.#{ name } at #{ service }"
  usesdomain = domain.match(/\w{8}-(\w{4}-){3}\w{12}/g) == null
  removeEvent()

  call = (service, action, args, callback) ->
    args = args ? {}

    uri = "#{ service }/#{ action }"

    $.ajax
      url: uri
      dataType: 'json'
      type: 'POST'
      data: args
      cache: true # cached uses _ which doesn't work with the appserver
      success: callback
      error: (data, error) ->
        log(data, error)
        try
          errorobj = $.parseJSON data.responseText
        catch error
          errorobj =
            message: "The request failed"
            exception: data.statusText + " (" + data.status + ")"
        msgp = $("<p>").addClass("jswizards-hide")
          .append($("<p>").addClass("jswizards-error").text(errorobj['exception'].replace(/\\n/g, "\n")))
        e = $("<div>")
          .html("Error Details &raquo;")
          .addClass("jswizards-error-details")
          .append(msgp)

        e.click ->
          p = $("div.jswizards-error-details > p")
          if p.hasClass("jswizards-hide")
            p.removeClass("jswizards-hide").addClass("jswizards-show")
          else
           p.removeClass("jswizards-show").addClass("jswizards-hide")
          true
        $("<div title='Server Error'>")
          .html("The Server Generated an Error!<br /><strong>" + errorobj['message'] + "</strong>")
          .append(e)
          .dialog
            modal: true
            buttons:
              Ok: ->
                $(this).dialog('close').dialog('destroy')

  args =
    wizardName: name
  firstarg = if usesdomain then "domainName" else "customerGuid"
  args[firstarg] = domain

  args.extra = extra if extra?

  call service, 'start', args, (data, status) ->
    log 'Start call returned', data

    [session, formData] = data

    call_ = (command, args_, callback_) ->
      call service, command, args_, callback_

    runWizard session, formData, call_, name, domain, callback, cancelCallback, args.extra, refresh

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

runWizard = (session, initialAction, call, wizardName, domain, cb, cancelCallback, extra, refresh=false) ->
  handleDisplay = (formData, callback) ->
    datahandler = DataHandler.create formData, call, callback, session, wizardName, domain, cancelCallback, extra
    datahandler.render()
    datahandler.registerSubmit()
    datahandler.display()

  handleEndOfWizard = (result) ->
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

    if cb
      cb result
    if refresh
      location.reload(true)

  initialAction_ = $.parseJSON(initialAction)

  handleAction = (action) ->
    if not action
        handleEndOfWizard()
        return
    switch action.action
      when 'display' then handleDisplay action.params, handleAction
      when 'endofwizard' then handleEndOfWizard action.result
      else throw new Error 'Unknown action type'

  handleAction initialAction_

class DataHandler
  constructor: (@data, @call, @callback, @session, @wizardName, @domain, @cancelCallback, @extra) ->
    @form = null

  render: ->
    @form = @getForm()
    @form.render()

  registerSubmit: () ->
    that = this
    @form.form.submit (evt) ->
      evt.preventDefault()
      valid = that.form.serialize($(this), that.data, true)

      if not valid
        throw new Error 'Validation failed'

      $('#jswizards-submit').attr('disabled', 'disabled')
      $('#imgLoader').css('visibility', 'inherit')
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

    if $.browser.msie
      @form.form.hide().show()

    $("*:input[type!=hidden]:first", @form.form).focus()

    #Register Remove Event for the floatbox
    that  = this
    $("#floatbox-box").bind "remove", ->
      if cleanClose
        return true
      cleanClose = true
      wizardForm = null
      args =
        sessionId: that.session
      that.call 'stop', args, (data, status) ->
        if that.cancelCallback
          that.cancelCallback()
        true

    $("#floatbox-background").addClass('floatbox-background')
    $("#floatbox-box").addClass('floatbox-box')

  refresh: ->
    box = $("#floatbox-box");
    height = box.height();
    if (height > $(window).height())
      height = $(window).height()
    box.css("margin-top", "-" + height/2 + "px");


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
    valid = @form.serialize(@form.form, @data, false)

    data = @getData()
    args =
      SessionId: @session
      methodName: methodname
      wizardName: @wizardName
      extra: @extra
      formData: JSON.stringify data
    if usesdomain
      args["domainName"] = @domain

    @call 'callback', args, (data, status) ->
      log "callback returned", data
      action = $.parseJSON data
      callback_ = ->
        that.callback action
      that.form.close callback_
    false

  getData: ->
    data =
      tabs: @data.tabs
      activeTab: @data.tabs[@form.form.find(".ui-tabs").tabs("option", "selected")].name
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

class NavigateDataHandler extends DataHandler
  getForm: ->
    class Dummy
      render: ->
        true
    new Dummy()

  registerSubmit: ->
    document.location = @data.url
    null

  display: ->
    null

  getData: ->
    @data.url


###
MessageBoxDataHandler
###
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

    new MessageBoxForm wizardForm, @data, callback, @extra

  getData: ->
    @data.value

  registerSubmit: ->
    null

  display: ->
    null

###
ProgressDataHandler
###
class ProgressDataHandler extends DataHandler
  getForm: ->
    that = this
    callback = (data) ->
      args =
        result: JSON.stringify data
        sessionId: that.session

      that.call 'result', args, (data, status) ->
        $(that.form.elem).dialog("close")
        $(that.form.elem).dialog("destroy")
        action = $.parseJSON data
        that.callback action

    percentage = (@data.value / (@data.maxvalue - (@data.minvalue - 1))) * 100
    outerbar = $('<div>').addClass('jswizards-progress-outer')
    innerbar = $('<div style="width:' + percentage + '%;">').addClass('jswizards-progress-inner')
    innerbar.html('&nbsp;')
    outerbar.append(innerbar)
    progresstext = $('<div>').html(@data.value + '/' + @data.maxvalue)
    progresstext.addClass('jswizards-progress-text')
    progressmessage = $('<div>').addClass('jswizards-progress-message').html(@data.message)

    container = $('<div>')
    container.append(outerbar)
    container.append(progresstext)
    container.append(progressmessage)

    data ={
        msgboxButtons: 'NoButtons',
        title: @data.title,
        message: container
    };

    new MessageBoxForm wizardForm, data, callback, @extra

  getData: ->
    @data.value

  registerSubmit: ->
    @form.callback(null)
    null

  display: ->
    null

DataHandler.create = (data, call, callback, session, wizardName, domain, cancelCallback, extra) ->
  switch data.control
    when 'form' then new FormDataHandler data, call, callback, session, wizardName, domain, cancelCallback, extra
    when 'messagebox' then new MessageBoxDataHandler data, call, callback, session, undefined, undefined, cancelCallback, extra
    when 'navigate' then new NavigateDataHandler data, call, callback, session
    when 'progress' then new ProgressDataHandler(data, call, callback, session, wizardName, domain, cancelCallback, extra)
    else new WizardDataHandler data, call, callback, session, undefined, undefined, cancelCallback


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

  serialize: (elem, form, validate) ->
    valid = true

    for tab in @tabs
      tab_ = _tab = null

      tabs = form.tabs
      for _tab in tabs
        if _tab.name == tab.name
          tab_ = _tab

      throw new Error 'Tab not found' if not tab_?
      valid &= tab.serialize elem, tab_, validate

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

    loader = $('<img>')
      .attr('src', 'img/ajax-loader.gif')
      .attr('id','imgLoader')
      .css('float', 'right')
      .css('visibility', 'hidden')

    content.append(loader)

    tabsPanel = $('<ul>')
      .addClass 'jswizards-tabs'

    content.append(tabsPanel)
    idx = 0
    tabidx = 0
    activetabname = @datahandler.data.activeTab
    ButtonNames = getButtons(@datahandler.extra)
    innernavi = getInnerNavi(@datahandler.extra)
    tabList = @tabs
    that = this
    for tab in tabList
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
      if tab.name == activetabname
        tabidx = idx
      idx++

      content.append(
        tab.render()
          .attr('id', "tab-#{ tab.name }")
          .addClass 'jswizards-tab'
        )

    content.tabs(
      selected: tabidx,
      show: (e, tab) ->
        that.datahandler.refresh();
    )

    form = $('<form>').append(content)
    form.append($('<div>').addClass('jswizards-form-buttons'))
    if ((tabList.length > 1) && innernavi )
      setupNavi = (idx) ->
        if (idx == 0)
          $('#btn-prev', form).addClass("disabled");
        else
          $('#btn-prev', form).removeClass("disabled");
        if (idx == tabList.length-1)
          $('#btn-next', form).addClass("disabled");
        else
          $('#btn-next', form).removeClass("disabled");

      content.tabs({
        select: (e, tab) ->
          setupNavi(tab.index);
      })

      $('.jswizards-form-buttons', form).append($('<div>')
        .addClass('jswizards-form-navi')
        .append($('<button>')
          .text(ButtonNames.previous)
          .attr('type', 'button')
          .attr('id', 'btn-prev')
          .addClass('button')
          .click (evt) ->
            idx = content.tabs('option', 'selected');
            if (idx>0)
              content.tabs({selected: idx-1});
        )
        .append($('<button>')
          .text(ButtonNames.next)
          .attr('type', 'button')
          .attr('id', 'btn-next')
          .addClass('button navigate')
          .click (evt) ->
            idx = content.tabs('option', 'selected');
            if (idx<tabList.length)
              content.tabs({selected: idx+1});
        )
      )
      setupNavi(tabidx);

    $('.jswizards-form-buttons', form).append($('<div>')
        .addClass('jswizards-form-okcancel')
        .append($('<button>')
          .text(ButtonNames.submit)
          .attr('type', 'submit')
          .attr('id', 'jswizards-submit')
          .addClass('button positive'))
        .append($('<button>')
          .text(ButtonNames.cancel)
          .attr('type', 'button')
          .attr('name', 'btn_cancel')
          .addClass('close-floatbox button negative')
          .click (evt) ->
            evt.preventDefault()
            false
        )
    );
    @form = form
    form


class MessageBoxForm extends Form
  constructor: (@form, @data, @callback, @extra) ->
    null

  render: ->
    buttons = []
    ButtonNames = getButtons(@extra)
    that     = this
    @elem = null
    if typeof @data.msgboxButtons == "object"
      buttons = @data.msgboxButtons
    else
      switch @data.msgboxButtons
        when 'OKCancel' then buttons = ['ok', 'cancel' ]
        when 'YesNo' then buttons = ['yes', 'no' ]
        when 'YesNoCancel' then buttons = ['yes', 'no', 'cancel' ]
        when 'NoButtons' then buttons = []
        else buttons = ['ok']
    buttonoptions = []
    $.each buttons, (index, button) ->
      option =
        text: ButtonNames[button] or button
        click: ->
          $(this).dialog "close"
          $(this).dialog "destroy"
          that.callback(ButtonValues[button] or button)
      buttonoptions.push option

    iconspaths =
      Information: 'jswizards/icons/information.png'
      Error: 'jswizards/icons/error.png'
      Warning: 'jswizards/icons/warning.png'
      Question: 'jswizards/icons/question.png'
    @elem = $("<div>")
      .dialog
        buttons: buttonoptions
        modal: true
        title: @data.title
      .append($("<img>").attr("src", iconspaths[@data.msgboxIcon]).attr("align", 'left'))
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

  serialize: (elem, tab, validate) ->
    valid = true

    for control in @controls
      control_ = _control = null

      controls = tab.elements
      for _control in controls
        if _control.name == control.data.name
          control_ = _control

      throw new Error 'Control not found' if not control_?
      valid &= control.serialize elem, control_, validate

    valid

  render: ->
    content = $('<div>')

    for control in @controls
      controlContainer = $('<div>')
        .addClass('jswizards-control')
        .addClass("jswizards-control-#{ control.control }")
        .attr('id', "control-#{ control.id }")

      control.render controlContainer
      content.append controlContainer

    content

###
Abstract form control class
###
class Control
  constructor: (@data, @tab) ->
    @control = data.control
    @id = "#{@tab.name}-#{@data.name}"
    @messageid = "message-#{@tab.name}-#{@data.name}"

  render: (container) ->
    l = $('<label>')
      .attr('for', @id)
      .text(@data.text)
    if not @data.optional
      l.append $('<span>').text('*').attr('style','color:red; margin-left:2px;')
    container.append l
    if @data.message?
      e = $("<span id='#{@messageid}'>")
        .html(@data.message)
        .addClass('jswizards-control-error')
        .addClass('error')
      if not @data.status or @data.status.toLowerCase() != 'error'
          e.hide()
      container.append e
    if @data.status and @data.status.toLowerCase() == 'error'
       container.addClass('control-error')
    container

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
      if @data.message?
        $("#"+ @messageid).text(@data.message)
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

    @addHelpText container
    if not @data.multiline
      i = $('<input>')
        .attr('type', if not @data.password then 'text' else 'password')
    else
      i = $('<textarea>')

    i.attr('id', @id)
      .addClass('text')
      .appendTo container

    @addCallback i

    if @data.value? and @data.multiline
      i.html(@data.value)
    else if @data.value?
      i.attr('value', @data.value)

    i

  serialize: (elem, control, validate) ->
    element = $("##{ @id }", elem)
    value = element.val()

    ensureTab = (tab) ->
      if not validate
        return
      if tab.form.datahandler.getData().activeTab != tab.name
          i = 0
          for localTab in tab.form.tabs
            if localTab == tab
              tab.form.form.find(".ui-tabs").tabs("select", i)
              return
            i += 1


    #TODO Enhance validation stuff
    message = $("##{@messageid}")
    valid = true
    if not @validateOptional value
      valid = false
    else if  not @checkValidator value
      valid = false
    else if not @validateNumber value
      valid = false
    else if not @validateMinMax value
      valid = false

    if not valid
      ensureTab(this.tab)
      element.addClass('error')
      control.value = null
      message.show()
      return false

    element.removeClass('error')
    message.hide()
    control.value = if @data.control=='number' then parseInt(value) else value

    true

###
Password Control
###
class PasswordControl extends TextControl

  render: (container) ->
    super
    if @data.confirm
      getStrength = (password)->
        strength = Math.ceil((password.length)/6)
        if strength > 3
          strength = 3
        if password.search(/[a-z]/) != -1
          strength++
        if password.search(/[A-Z]/) != -1
          strength++
        if password.search(/[0-9]/) != -1
          strength++
        if password.search(/[^a-zA-Z0-9]/) != -1
          strength++
        strength
      outerbar = $("<div>", {style: "background-color: gray; width:245px; height: 5px;"})
      bar = $("<div>", {style: "background-color: red; width:0px; height: 5px;"}).appendTo(outerbar)

      j = $('<input>')
          .attr('type', 'password')
      j.attr('id', @id+"confirm").addClass('text').appendTo(container)
      outerbar.appendTo(container)
      $('#' +@id).live 'keyup', =>
        strength = getStrength($("#" + @id).val())
        bar.css("width", 35 *strength)
        if strength < 3
          bar.css("background-color", "red")
        else if strength < 5
          bar.css("background-color" , "orange")
        else
          bar.css("background-color" , "green")
      j
  checkValidator: (value) ->
    if @data.confirm
        password = $("#" + @id).val()
        cpassword = $("#" + @id + "confirm").val()
        if password != cpassword
            $("#"+ @messageid).text("Passwords don't match");
            return false
        return true
    else
        return super




###
Label Control
###
class LabelControl extends Control
  render: (container) ->
    l = $('<label>')
      .html(@data.text)
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
      .attr('id', @id)
      .addClass('jswizards-control-select')

    @addCallback i

    sel = @data.value
    oldval = @data.selvalue if @data.selvalue

    addValue = (k, v) ->
      o = $('<option>')
      o.attr('value', k)
        .text(v)

      if sel == k.toString()
        o.attr('selected','selected')

      o.appendTo i

    if $.isArray(@data.values)
      for item in @data.values
        if $.isArray(item)
          addValue(item[0], item[1])
        else
          for k, v of item
            addValue(k, v)
    else
      for k, v of @data.values
        addValue(k, v)

    i.appendTo container

    i

  serialize: (elem, control) ->
    control.value = $("##{ @id }").val()
    true

###
Choice Control
###
class ChoiceControl extends Control
  render: (container) ->
    super

    @addHelpText container

    i = $('<div>')

    optname = @id
    optsel = @data.value
    if optsel == undefined
      optsel = @data.selectedvalue


    addValue = (k, v) ->
      o = $('<input>')
      o.attr('type', 'radio')
        .attr('name', optname)
        .attr('value', JSON.stringify k)

      if optsel == k
        o.attr('checked','checked')

      $('<div>')
        .append(o)
        .append(v)
        .appendTo(i)

    if $.isArray(@data.values)
      for item in @data.values
        if $.isArray(item)
          addValue(item[0], item[1])
        else
          for k, v of item
            addValue(k, v)
    else
      for k, v of @data.values
        addValue(k, v)

    @addCallback i

    i.appendTo container

    i

  serialize: (elem, control) ->
    value = $("input[name=#{ @id }]:checked", elem).val()
    if value
      control.value  = JSON.parse value
    else
      control.value = null

    true

###
Choice Multiple Control
###
class ChoiceMultipleControl extends Control
  render: (container) ->
    super

    @addHelpText container

    i = $('<div>')
      .attr('for', @id)

    optname = @id
    optsel = @data.value

    addValue = (k, v) ->
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

    if $.isArray(@data.values)
      for item in @data.values
        if $.isArray(item)
          addValue(item[0], item[1])
        else
          for k, v of item
            addValue(k, v)
    else
      for k, v of @data.values
        addValue(k, v)

    @addCallback i

    i.appendTo container

    i

  serialize: (elem, control) ->
    element = $("div[htmlfor=#{ @id }]")
    value = new Array()
    $("input[name=#{ @id }]:checked").each ->
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
      .attr("id", @id)
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
    percentage = (@data.value / (@data.maxvalue - (@data.minvalue - 1))) * 100
    outerbar = $('<div>').addClass('jswizards-progress-outer')
    innerbar = $('<div style="width:' + percentage + '%;">').addClass('jswizards-progress-inner')
    innerbar.html('&nbsp;')
    outerbar.append(innerbar)
    progresstext = $('<div>').html(@data.value + '/' + @data.maxvalue)
    progresstext.addClass('jswizards-progress-text')
    progressmessage = $('<div>').addClass('jswizards-progress-message').html(@data.message)

    container.append(outerbar)
    container.append(progresstext)
    container.append(progressmessage)

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
      .attr('id', @id)
      .attr('name', @id)
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
    element = $("input[name=#{ @id }]", elem)
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
    when 'text'
      if data.password
        new PasswordControl data, tab
      else
        new TextControl data, tab
    when 'label' then new LabelControl data, tab
    when 'dropdown' then new DropDownControl data, tab
    when 'dropdownext' then new DropDownControl data, tab
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
