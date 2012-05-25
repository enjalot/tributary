# Vadim Ogievetsky

# DVL is a framework for building highly interactive user interfaces and data visualizations dynamically with JavaScript.
# DVL is based the concept that the data in a program should be the programmer’s main focus.


`
function lift(fn) {
  var fn = arguments[0];
  if ('function' !== typeof fn) throw new TypeError();

  return function(/* args: to fn */) {
    var args = Array.prototype.slice.call(arguments),
        n = args.length,
        i;

    for (i = 0; i < n; i++) {
      if ('function' === typeof args[i]) {
        return function(/* args2 to function wrapper */) {
          var args2 = Array.prototype.slice.call(arguments),
              reduced = [],
              i, v;

          for (i = 0; i < n; i++) {
            v = args[i];
            reduced.push('function' === typeof v ? v.apply(this, args2) : v);
          }

          return fn.apply(null, reduced);
        };
      }
    }

    // Fell through so there are no functions in the arguments to fn -> call it!
    return fn.apply(null, args);
  };
}
`

Array::filter ?= (fun, thisp) ->
  throw new TypeError() if typeof fun isnt 'function'

  res = new Array()
  for val in this
    res.push val if fun.call(thisp, val, i, this)

  return res


dvl = { version: '1.0.0' }
this.dvl = dvl
if typeof module isnt 'undefined' and module.exports
  module.exports = dvl
  dvl.dvl = dvl


do ->
  array_ctor = (new Array).constructor
  date_ctor  = (new Date).constructor
  regex_ctor = (new RegExp).constructor
  dvl.typeOf = (v) ->
    if typeof(v) is 'object'
      return 'null'  if v == null
      return 'array' if v.constructor == array_ctor
      return 'date'  if v.constructor == date_ctor
      return 'object'
    else
      return 'regex' if v?.constructor == regex_ctor
      return typeof(v)


dvl.util = {
  strObj: (obj) ->
    type = dvl.typeOf(obj)
    if type in ['object', 'array']
      str = []
      keys = []
      keys.push k for k of obj
      keys.sort()
      str.push k, dvl.util.strObj(obj[k]) for k in keys
      return str.join('|')

    if type is 'function'
      return '&'

    return String(obj)


  uniq: (array) ->
    seen = {}
    uniq = []
    for a in array
      uniq.push a unless seen[a]
      seen[a] = 1

    return uniq


  flip: (array) ->
    map = {};
    i = 0;
    while i < array.length
      map[array[i]] = i
      i++

    return map


  getMinMax: (input, acc) ->
    acc = ((x) -> x) unless acc
    min = +Infinity
    max = -Infinity
    minIdx = -1
    maxIdx = -1

    for d,i in input
      v = acc(d)
      if v < min
        min = v
        minIdx = i
      if max < v
        max = v
        maxIdx = i

    return { min, max, minIdx, maxIdx }


  crossDomainPost: (url, params) ->
    frame = d3.select('body').append('iframe').style('display', 'none')

    clean = (d) -> d.replace(/'/g, "\\'")
    inputs = []
    inputs.push "<input name='#{k}' value='#{clean(v)}'/>" for k,v of params

    post_process = frame.node().contentWindow.document
    post_process.open()
    post_process.write "<form method='POST' action='#{url}'>#{inputs.join('')}</form>"
    post_process.write "<script>window.onload=function(){document.forms[0].submit();}</script>"
    post_process.close()
    setTimeout(frame.remove, 800)
    return;

  isEqual: (a, b, cmp) ->
    # Check object identity.
    return true if a is b
    # Different types?
    atype = dvl.typeOf(a)
    btype = dvl.typeOf(b)
    return false if atype isnt btype
    # One is falsy and the other truthy.
    return false if (not a and b) or (a and not b)
    # Check dates' integer values.
    return a.getTime() is b.getTime() if atype is 'date'
    # Both are NaN?
    return false if a isnt a and b isnt b
    # and Compare regular expressions.
    return a.source is b.source and a.global is b.global and a.ignoreCase is b.ignoreCase and a.multiline is b.multiline if atype is 'regex'
    # If a is not an object by this point, we can't handle it.
    return false unless atype is 'object' or atype is 'array'
    # Check if already compared
    if cmp
      for c in cmp
        return true if (c.a is a and c.b is b) or (c.a is b and c.b is a)
    # Check for different array lengths before comparing contents.
    return false if a.length? and a.length isnt b.length
    # Nothing else worked, deep compare the contents.
    aKeys = []
    aKeys.push k for k of a
    bKeys = []
    bKeys.push k for k of b
    # Different object sizes?
    return false if aKeys.length isnt bKeys.length
    # Recursive comparison of contents.
    cmp = if cmp then cmp.slice() else []
    cmp.push {a,b}
    for k of a
      return false unless b[k]? and dvl.util.isEqual(a[k], b[k], cmp)

    return true

  clone: (obj) ->
    t = dvl.typeOf(obj)
    switch t
      when 'array'
        return obj.slice()
      when 'object'
        ret = {}
        ret[k] = v for k,v of obj
        return ret
      when 'date'
        return new Date(obj.getTime())
      else
        return obj

  escapeHTML: (str) ->
    return str.replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;')
}

(->
  nextObjId = 1
  variables = {}
  registerers = {}
  curBlock = null
  default_compare = (a, b) -> a is b

  class DVLConst
    constructor: (val) ->
      @v = val ? null
      @changed = false
      return this

    toString: ->
      tag = if @n then @n + ':' else ''
      return "[#{@tag}#{@v}]"

    value: (val) ->
      return if arguments.length then this else @v

    set: -> this
    lazyValue: -> this
    update: -> this
    get: -> @v
    getPrev: -> @v
    hasChanged: -> @changed
    resetChanged: -> null
    notify: -> null
    discard: -> null
    name: ->
      if arguments.length is 0
        return @n ? '<anon_const>'
      else
        @n = arguments[0]
        return this
    compare: -> if arguments.length then this else default_compare

    setGen: -> this
    gen: ->
      that = this
      if dvl.typeOf(@v) == 'array'
        (i) -> that.value[i]
      else
        () -> that.value
    genPrev: (i) -> @gen(i)
    len: ->
      if dvl.typeOf(@v) == 'array'
        @v.length
      else
        Infinity


  class DVLDef
    constructor: (val) ->
      @v = val ? null
      @id = nextObjId
      @prev = null
      @changed = false
      @vgen = undefined
      @vgenPrev = undefined
      @vlen = -1
      @lazy = null
      @listeners = []
      @changers = []
      @compareFn = default_compare
      variables[@id] = this
      nextObjId++
      curBlock.addMemeber(this) if curBlock
      return this

    resolveLazy: ->
      if @lazy
        @prev = @v
        @v = @lazy()
        @lazy = null
      return

    toString: ->
      tag = if @n then @n + ':' else ''
      return "[#{@tag}#{@val}]"

    hasChanged: -> @changed

    resetChanged: ->
      @changed = false
      return this

    value: (val) ->
      if arguments.length
        val = val ? null
        if not (@compareFn and @compareFn(val, @v))
          this.set(val)
          dvl.notify(this)
        return this
      else
        @resolveLazy()
        return @v

    set: (val) ->
      val = val ? null
      @prev = @v unless @changed
      @v = val
      @vgen = undefined
      @changed = true
      @lazy = null
      return this
    lazyValue: (fn) ->
      @lazy = fn
      @changed = true
      dvl.notify(this)
      return this
    update: (val) ->
      if not dvl.util.isEqual(val, @v)
        this.set(val)
        dvl.notify(this)
      return this
    get: ->
      @resolveLazy()
      return @v
    getPrev: ->
      @resolveLazy()
      if @prev and @changed then @prev else @v
    notify: ->
      dvl.notify(this)
    discard: ->
      if @listeners.length > 0
        throw "Cannot remove variable #{@id} because it has listeners."
      if @changers.length > 0
        throw "Cannot remove variable #{@id} because it has changers."
      delete variables[@id]
      return null
    name: ->
      if arguments.length is 0
        return @n ? '<anon>'
      else
        @n = arguments[0]
        return this
    compare: ->
      if arguments.length
        @compareFn = arguments[0]
        return this
      else
        return @compareFn

    setGen: (g, l) ->
      if g is null
        l = 0
      else
        l = Infinity if l is undefined
      @vgenPrev = @vgen unless @changed
      @vgen = g
      @vlen = l
      @changed = true
      return this
    gen: ->
      if @vgen != undefined
        return @vgen
      else
        that = this
        if dvl.typeOf(@v) == 'array'
          return ((i) -> that.value[i])
        else
          return (-> that.value)
    genPrev: ->
      if @vgenPrev and @changed then @vgenPrev else @gen()
    len: ->
      if @vlen >= 0
        return @vlen
      else
        if @v?
          return if dvl.typeOf(@v) == 'array' then @v.length else Infinity
        else
          return 0


  class DVLFunctionObject
    constructor: (@id, @name, @ctx, @fn, @listen, @change) ->
      @depends = []
      @level = 0
      curBlock.addMemeber(this) if curBlock
      return this

    addChange: ->
      uv = uniqById(arguments)

      if uv.length
        for v in uv
          @change.push(v)
          v.changers.push(this)
          for l in v.listeners
            l.depends.push(this)
            @level = Math.max(@level, l.level+1)

        checkForCycle(this)
        bfsUpdate([this])

      return this

    addListen: ->
      uv = uniqById(arguments)

      if uv.length
        for v in uv
          @listen.push(v)
          v.listeners.push(this)
          for c in v.changers
            @depends.push(c)

        checkForCycle(this)
        bfsUpdate([this])

      uv = uniqById(arguments, true)
      start_notify_collect(this)
      changedSave = []
      for v in uv
        changedSave.push(v.changed)
        v.changed = true
      @fn.apply(@ctx)
      for v,i in uv
        v.changed = changedSave[i]
      end_notify_collect()
      return this

    discard: ->
      # Find the register object
      delete registerers[@id]

      bfsZero([this])

      queue = []
      for cv in @change
        for lf in cv.listeners
          queue.push lf
          lf.depends.splice(lf.depends.indexOf(this), 1)

      for v in @change
        v.changers.splice(v.changers.indexOf(this), 1)

      for v in @listen
        v.listeners.splice(v.listeners.indexOf(this), 1)

      # I think this hould be queue [ToDo]
      bfsUpdate(@depends) # do not care if @update gets trashed
      @change = @listen = @depends = null # cause an error if we hit these
      return


  class DVLBlock
    constructor: (@name, @parent) ->
      @owns = {}
      @parent?.add(this)
      return

    addMemeber: (thing) ->
      @owns[thing.id] = thing
      return this

    removeMemeber: (thing) ->
      delete @owns[thing.id]
      return this

    discard: ->
      @parent?.removeMemeber(this)
      d.discard() for d in @owns
      return


  dvl.blockFn = ->
    switch arguments.length
      when 1 then [fn] = arguments
      when 2 then [name, fn] = arguments
      else throw "bad number of arguments"

    return (args...) ->
      block = new DVLBlock(name, curBlock)
      ret = fn.apply(this, args)
      curBlock = block.parent
      return ret

  dvl.block = ->
    switch arguments.length
      when 1 then [fn] = arguments
      when 2 then [name, fn] = arguments
      else throw "bad number of arguments"

    block = new DVLBlock(name, curBlock)
    fn.call(this)
    curBlock = block.parent
    return block


  dvl.const = (value) -> new DVLConst(value)
  dvl.def   = (value) -> new DVLDef(value)

  dvl.knows = (v) -> v instanceof DVLConst or v instanceof DVLDef

  dvl.wrapConstIfNeeded =
  dvl.wrap = (v, name) ->
    v = null if v is undefined
    if dvl.knows(v) then v else dvl.const(v).name(name)

  dvl.wrapVarIfNeeded =
  dvl.wrapVar = (v, name) ->
    v = null if v is undefined
    if dvl.knows(v) then v else dvl.def(v).name(name)

  dvl.valueOf = (v) ->
    if dvl.knows(v)
      return v.value()
    else
      return v ? null

  # filter out undefineds and nulls and constants also make unique
  uniqById = (vs, allowConst) ->
    res = []
    if vs
      seen = {}
      for v in vs
        if v? and (allowConst or (v.listeners and v.changers)) and not seen[v.id]
          seen[v.id] = true
          res.push v
    return res


  checkForCycle = (fo) ->
    stack = fo.depends.slice()
    visited = {}

    while stack.length > 0
      v = stack.pop()
      visited[v.id] = true

      for w in v.depends
        throw "circular dependancy detected around #{w.id}" if w is fo
        stack.push w if not visited[w.id]

    return


  bfsUpdate = (stack) ->
    while stack.length > 0
      v = stack.pop()
      nextLevel = v.level+1

      for w in v.depends
        if w.level < nextLevel
          w.level = nextLevel
          stack.push w

    return


  bfsZero = (queue) ->
    while queue.length > 0
      v = queue.shift()
      for w in v.depends
        w.level = 0
        queue.push w

    return


  dvl.register = ({ctx, fn, listen, change, name, force, noRun}) ->
    throw 'cannot call register from within a notify' if curNotifyListener
    throw 'fn must be a function' if typeof(fn) != 'function'

    listen = [listen] unless dvl.typeOf(listen) is 'array'
    change = [change] unless dvl.typeOf(change) is 'array'

    listenConst = []
    if listen
      for v in listen
        listenConst.push v if v instanceof DVLConst
    listen = uniqById(listen)
    change = uniqById(change)

    if listen.length isnt 0 or change.length isnt 0 or force
      # Make function/context holder object; set level to 0
      id = ++nextObjId
      fo = new DVLFunctionObject(id, (name or 'fn'), ctx, fn, listen, change)

      # Append listen and change to variables
      for v in listen
        throw "No such DVL variable #{id} in listeners" unless v
        v.listeners.push fo

      for v in change
        throw "No such DVL variable #{id} in changers" unless v
        v.changers.push fo

      # Update dependancy graph
      for cv in change
        for lf in cv.listeners
          lf.depends.push fo
          fo.level = Math.max(fo.level, lf.level+1)

      for lv in listen
        for cf in lv.changers
          fo.depends.push cf

      registerers[id] = fo
      checkForCycle(fo)
      bfsUpdate([fo])

    if not noRun
      # Save changes and run the function with everythign as changed.
      changedSave = []
      for l,i in listen
        changedSave[i] = l.changed
        l.changed = true
      for l in listenConst
        l.changed = true

      start_notify_collect(fo)
      fn.apply ctx
      end_notify_collect()

      for c,i in changedSave
        listen[i].changed = c
      for l in listenConst
        l.changed = false

    return fo


  dvl.clearAll = ->
    # disolve the graph to make the garbage collection job as easy as possibe
    for k, l of registerers
      l.listen = l.change = l.depends = null

    for k, v of variables
      v.listeners = v.changers = null

    # reset everything
    nextObjId = 1
    variables = {}
    registerers = {}
    return


  levelPriorityQueue = do ->
    queue = []
    sorted = true

    compare = (a, b) ->
      levelDiff = a.level - b.level
      return if levelDiff is 0 then b.id - a.id else levelDiff

    return {
      push: (l) ->
        queue.push l
        sorted = false
        return

      shift: ->
        if not sorted
          queue.sort(compare)
          sorted = true
        return queue.pop()

      length: ->
        return queue.length
    }

  curNotifyListener = null
  curCollectListener = null
  changedInNotify = null
  lastNotifyRun = null
  toNotify = null


  start_notify_collect = (listener) ->
    toNotify = []
    curCollectListener = listener
    dvl.notify = collect_notify
    return


  end_notify_collect = ->
    curCollectListener = null
    dvl.notify = init_notify # ToDo: possible nested notify?

    dvl.notify.apply(null, toNotify)
    toNotify = null
    return


  collect_notify = ->
    throw 'bad stuff happened collect' unless curCollectListener

    for v in arguments
      continue unless v instanceof DVLDef
      throw "changed unregisterd object #{v.id}" if v not in curCollectListener.change
      toNotify.push v

    return


  within_notify = ->
    throw 'bad stuff happened within' unless curNotifyListener

    for v in arguments
      continue unless v instanceof DVLDef
      throw "changed unregisterd object #{v.id}" if v not in curNotifyListener.change
      changedInNotify.push v
      lastNotifyRun.push v.id
      for l in v.listeners
        if not l.visited
          levelPriorityQueue.push l

    return


  init_notify = ->
    throw 'bad stuff happened init' if curNotifyListener

    lastNotifyRun = []
    visitedListener = []
    changedInNotify = []

    for v in arguments
      continue unless v instanceof DVLDef
      changedInNotify.push v
      lastNotifyRun.push v.id
      levelPriorityQueue.push l for l in v.listeners

    dvl.notify = within_notify

    # Handle events in a BFS way
    while levelPriorityQueue.length() > 0
      curNotifyListener = levelPriorityQueue.shift()
      continue if curNotifyListener.visited
      curNotifyListener.visited = true
      visitedListener.push(curNotifyListener)
      lastNotifyRun.push(curNotifyListener.id)
      curNotifyListener.fn.apply(curNotifyListener.ctx)

    curNotifyListener = null
    dvl.notify = init_notify
    v.resetChanged() for v in changedInNotify
    l.visited = false for l in visitedListener # reset visited
    return


  dvl.notify = init_notify

  ######################################################
  ##
  ##  Renders the variable graph into dot
  ##
  dvl.graphToDot = (lastTrace, showId) ->
    execOrder = {}
    if lastTrace and lastNotifyRun
      for pos, id of lastNotifyRun
        execOrder[id] = pos

    nameMap = {}

    for k, l of registerers
      fnName = l.id.replace(/\n/g, '')
      #fnName = fnName.replace(/_\d+/, '') unless showId
      fnName = fnName + ' (' + l.level + ')'
      # fnName += ' [[' + execOrder[l.id] + ']]' if execOrder[l.id]
      fnName = '"' + fnName + '"'
      nameMap[l.id] = fnName

    for id,v of variables
      varName = id.replace(/\n/g, '')
      #varName = varName.replace(/_\d+/, '') unless showId
      # varName += ' [[' + execOrder[id] + ']]' if execOrder[id]
      varName = '"' + varName + '"'
      nameMap[id] = varName

    dot = []
    dot.push 'digraph G {'
    dot.push '  rankdir=LR;'

    levels = []
    for id,v of variables
      color = if execOrder[id] then 'red' else 'black'
      dot.push "  #{nameMap[id]} [color=#{color}];"

    for k, l of registerers
      levels[l.level] or= []
      levels[l.level].push nameMap[l.id]
      color = if execOrder[l.id] then 'red' else 'black'

      dot.push "  #{nameMap[l.id]} [shape=box,color=#{color}];"
      for v in l.listen
        color = if execOrder[v.id] and execOrder[l.id] then 'red' else 'black'
        dot.push "  #{nameMap[v.id]} -> #{nameMap[l.id]} [color=#{color}];"
      for w in l.change
        color = if execOrder[l.id] and execOrder[w.id] then 'red' else 'black'
        dot.push "  #{nameMap[l.id]} -> #{nameMap[w.id]} [color=#{color}];"

    for level in levels
      dot.push('{ rank = same; ' + level.join('; ') + '; }')

    dot.push '}'
    return dot.join('\n')

  dvl.postGraph = (file, showId) ->
    file or= 'dvl_graph'
    g = dvl.graphToDot(false, showId)
    dvl.util.crossDomainPost('http://localhost:8124/' + file, { graph: JSON.stringify(g) })
    return

  dvl.postLatest = (file, showId) ->
    file or= 'dvl_graph_latest'
    g = dvl.graphToDot(true, showId)
    dvl.util.crossDomainPost('http://localhost:8124/' + file, { graph: JSON.stringify(g) })
    return

)()

dvl.zero = dvl.const(0).name('zero')

dvl.null = dvl.const(null).name('null')

dvl.ident = (x) -> x
dvl.identity = dvl.const(dvl.ident).name('identity')


dvl.acc = (column) ->
  column = dvl.wrap(column);
  acc = dvl.def().name("acc")

  makeAcc = ->
    col = column.value();
    if col?
      acc.set((d) -> d[col])
    else
      acc.set(null)

    dvl.notify(acc)

  dvl.register({fn:makeAcc, listen:[column], change:[acc], name:'make_acc'})
  return acc


# Workers # -----------------------------------------

######################################################
##
##  A DVL object debugger
##
##  Displays the object value with a message whenever the object changes.
##
dvl.debug = ->
  print = ->
    return unless console?.log
    console.log.apply(console, arguments)
    return arguments[0]

  if arguments.length is 1
    obj = dvl.wrap(arguments[0])
    note = obj.name() + ':'
  else
    obj = dvl.wrap(arguments[1])
    note = arguments[0]

  dvl.register {
    listen: [obj]
    fn: -> print note, obj.value()
  }
  return obj


######################################################
##
##  Sets up a pipline stage that automaticaly applies the given function.
##
dvl.apply = dvl.applyValid = ->
  switch arguments.length
    when 1
      arg0 = arguments[0]
      if typeof arg0 is 'function'
        fn = arg0
      else
        {fn, args, name, invalid, allowNull, update} = arg0
    when 2
      [args, fn] = arguments
    when 3
      [args, {name, invalid, allowNull, update}, fn] = arguments
    else
      throw "incorect number of arguments"

  fn = dvl.wrap(fn or dvl.identity)

  argsType = dvl.typeOf(args)
  if argsType is 'undefined'
    args = []
  else
    args = [args] unless argsType is 'array'
    args = args.map(dvl.wrap)

  invalid = dvl.wrap(invalid ? null)

  out = dvl.def(invalid.value()).name(name or 'apply_out')

  dvl.register {
    name: (name or 'apply')+'_fn'
    listen: args.concat([fn, invalid])
    change: [out]
    fn: ->
      f = fn.value()
      return unless f?
      send = []
      nulls = false
      for a in args
        v = a.value()
        nulls = true unless v?
        send.push v

      if not nulls or allowNull
        r = f.apply(null, send)
        return if r is undefined
      else
        r = invalid.value()

      if update
        out.update(r)
      else
        out.set(r).notify()

      return
  }
  return out


dvl.applyAlways = ->
  switch arguments.length
    when 1
      arg0 = arguments[0]
      if typeof arg0 is 'function'
        fn = arg0
      else
        {fn, args, name, update} = arg0
    when 2
      [args, fn] = arguments
    when 3
      [args, {name, update}, fn] = arguments
    else
      throw "incorect number of arguments"

  return dvl.apply {
    args
    allowNull: true
    fn
    name
    update
  }


dvl.random = (options) ->
  min = options.min or 0
  max = options.max or min + 10
  int = options.integer
  walk = options.walk

  random = dvl.def((max - min)/2, options.name or 'random')

  gen = ->
    if walk and walk > 0
      # do a random walk
      scale = walk * Math.abs(max - min)
      r = random.value() + scale*(2*Math.random()-1)
      r = min if r < min
      r = max if max < r
    else
      r = Math.random()*(max-min) + min

    r = Math.floor(r) if int
    random.set(r)
    dvl.notify(random)

  setInterval(gen, options.interval) if options.interval
  gen()
  return random


dvl.arrayTick = (data, options) ->
  throw 'dvl.arrayTick: no data' unless data
  data = dvl.wrap(data)

  point = options.start or 0
  move = options.move or 1

  out = dvl.def(null, 'array_tick_data')

  gen = ->
    d = data.value()
    len = d.length
    if len > 0
      v = d[point % len]
      point = (point + move) % len
      out.set(v)
      dvl.notify(out)

  setInterval(gen, options.interval) if options.interval
  gen()
  return out


dvl.recorder = (options) ->
  array = dvl.wrapVar(options.array or [], options.name or 'recorder_array').compare(false)

  data = options.data
  fn = dvl.wrap(options.fn or dvl.identity)
  throw 'it does not make sense not to have data' unless dvl.knows(data)

  max = dvl.wrap(options.max or +Infinity)
  i = 0

  record = ->
    d = fn.value()(data.value())
    m = max.value()
    if d?
      if options.value
         o = {}
         o[options.value] = d
         d = o
      d[options.index] = i if options.index
      d[options.timestamp] = new Date() if options.timestamp
      _array = array.value()
      _array.push(d)
      _array.shift() while m < _array.length
      array.value(_array)
      i += 1

  dvl.register({fn:record, listen:[data], change:[array], name:'recorder'})
  return array


##-------------------------------------------------------
##
##  Asynchronous ajax fetcher.
##
##  Fetches ajax data form the server at the given url.
##  This function addes the given url to the global json getter,
##  the getter then automaticly groups requests that come from the same event cycle.
##
## ~url:  the url to fetch.
## ~data: data to send
##  type: the type of the request. [json]
##  map:  a map to apply to the recived array.
##  fn:   a function to apply to the recived input.
##
(->
  outstanding = dvl.def(0).name('json_outstanding')
  ajaxManagers = []
  normalRequester = null

  makeManager = ->
    nextQueryId = 0
    initQueue = []
    queries = {}

    maybeDone = (request) ->
      for q in request
        return if q.status isnt 'ready'

      notify = []
      for q in request
        if q.hasOwnProperty('resVal')
          q.res.set(q.resVal ? null)
          notify.push(q.res)
          q.status = ''
          delete q.resVal

      dvl.notify.apply(null, notify)
      return

    getData = (err, resVal) ->
      q = this.q
      if @url is q.url.value() and (@method is 'GET' or (@data is q.data.value() and @dataFn is q.dataFn.value()))
        if err
          q.resVal = null
          q.onError(err) if q.onError
        else
          q.resVal = if @url then resVal else null

      q.status = 'ready'
      q.curAjax = null

      maybeDone(this.request)
      return

    makeRequest = (q, request) ->
      _url = q.url.value()
      _data = q.data.value()
      _dataFn = q.dataFn.value()
      _method = q.method.value()
      _dataType = q.type.value()
      ctx = {
        q
        request
        url:    _url
        data:   _data
        dataFn: _dataFn
        method: _method
      }
      q.curAjax.abort() if q.curAjax
      if _url? and (_method is 'GET' or (_data? and _dataFn?)) and _dataType
        if q.invalidOnLoad.value()
          q.res.update(null)

        q.curAjax = q.requester.request {
          url: _url
          data: _data
          dataFn: _dataFn
          method: _method
          dataType: _dataType
          contentType: q.contentType.value()
          processData: q.processData.value()
          fn: q.fn
          outstanding
          complete: (err, data) -> getData.call(ctx, err, data)
        }

      else
        getData.call(ctx, null, null)

      return

    inputChange = ->
      bundle = []
      for id, q of queries
        continue unless q.url.hasChanged() or q.data.hasChanged() or q.dataFn.hasChanged()

        if q.status is 'virgin'
          if q.url.value()
            initQueue.push q
            q.status = 'requesting'
            makeRequest(q, initQueue)
          else
            q.status = ''
        else
          bundle.push(q)

      if bundle.length > 0
        q.status = 'requesting' for q in bundle
        makeRequest(q, bundle)  for q in bundle

      return

    fo = null
    addHoock = (url, data, dataFn, ret) ->
      if fo
        fo.addListen(url, data, dataFn)
        fo.addChange(ret)
      else
        fo = dvl.register {
          name:   'ajax_man'
          listen: [url, data]
          change: [ret, outstanding]
          fn:     inputChange
          force:  true
        }

      return


    return (url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name) ->
      nextQueryId++
      res = dvl.def().name(name)
      q = {
        id: nextQueryId
        url
        data
        dataFn
        method
        contentType
        processData
        res
        status: 'virgin'
        type
        requester
        onError
        invalidOnLoad
      }
      q.fn = fn if fn
      queries[q.id] = q
      addHoock(url, data, dataFn, res)
      return res


  dvl.ajax = ({url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, groupId, requester, name}) ->
    throw 'it does not make sense to not have a url' unless url
    throw 'the fn function must be non DVL variable' if fn and dvl.knows(fn)
    url  = dvl.wrap(url)
    data = dvl.wrap(data)
    dataFn = dvl.wrap(dataFn or dvl.indentity)
    method = dvl.wrap(method or 'GET')
    type = dvl.wrap(type or 'json')
    contentType = dvl.wrap(contentType or 'application/x-www-form-urlencoded')
    processData = dvl.wrap(processData ? true)
    invalidOnLoad = dvl.wrap(invalidOnLoad or false)
    name or= 'ajax_data'

    groupId = dvl.ajax.getGroupId() unless groupId?
    ajaxManagers[groupId] or= makeManager()

    if not requester
      normalRequester or= dvl.ajax.requester.normal()
      requester = normalRequester

    return ajaxManagers[groupId](url, data, dataFn, method, type, contentType, processData, fn, invalidOnLoad, onError, requester, name)

  dvl.json = dvl.ajax
  dvl.ajax.outstanding = outstanding

  nextGroupId = 0
  dvl.ajax.getGroupId = ->
    id = nextGroupId
    nextGroupId++
    return id

)()

dvl.ajax.requester = {
  normal: () ->
    return {
      request: ({url, data, dataFn, method, dataType, contentType, processData, fn, outstanding, complete}) ->
        dataVal = if method isnt 'GET' then dataFn(data) else null

        getData = (resVal) ->
          if fn
            ctx = { url, data }
            resVal = fn.call(ctx, resVal)

          ajax = null
          complete(null, resVal)
          return

        getError = (xhr, textStatus) ->
          return if textStatus is "abort"
          ajax = null
          complete(xhr.responseText or textStatus, null)
          return

        ajax = jQuery.ajax {
          url
          data:        dataVal
          type:        method
          dataType
          contentType
          processData
          success:     getData
          error:       getError
          complete:    -> outstanding.value(outstanding.value() - 1)
          context:     { url }
        }

        outstanding.value(outstanding.value() + 1)

        return {
          abort: ->
            if ajax
              ajax.abort()
              ajax = null

            return
        }
    }


  cache: ({max, timeout, keyFn} = {}) ->
    max = dvl.wrap(max or 100)
    timeout = dvl.wrap(timeout or 30*60*1000)
    cache = {}
    count = 0
    keyFn or= (url, data, method, dataType, contentType, processData) ->
      return [url, dvl.util.strObj(data), method, dataType, contentType, processData].join('@@')

    trim = ->
      tout = timeout.value()
      if tout > 0
        cutoff = Date.now() - tout
        newCache = {}
        for q,d of cache
          newCache[q] = d if cutoff < d.time
        cache = newCache

      m = max.value()
      while m < count
        oldestQuery = null
        oldestTime = Infinity
        for q,d of cache
          if d.time < oldestTime
            oldestTime = d.time
            oldestQuery = q
        delete cache[oldestQuery]
        count--

    dvl.register {fn:trim, listen:[max, timeout], name:'cache_trim'}


    return {
      request: ({url, data, dataFn, method, dataType, contentType, processData, fn, outstanding, complete}) ->
        dataVal = if method isnt 'GET' then dataFn(data) else null
        key = keyFn(url, data, method, dataType, contentType, processData)

        c = cache[key]
        added = false
        if not c
          # first time we see this query, create stub
          cache[key] = c = {
            time: Date.now()
            waiting: [complete]
          }
          added = true
          count++
          trim()

          # make the request
          getData = (resVal) ->
            if fn
              ctx = { url, data }
              resVal = fn.call(ctx, resVal)

            c.ajax = null
            c.resVal = resVal
            cb(null, resVal) for cb in c.waiting
            delete c.waiting
            return

          getError = (xhr, textStatus) ->
            return if textStatus is "abort"
            c.ajax = null
            delete cache[key]
            count--
            cb(xhr.responseText or textStatus, null) for cb in c.waiting
            delete c.waiting
            return

          c.ajax = jQuery.ajax {
            url
            data:        dataVal
            type:        method
            dataType
            contentType
            processData
            success:     getData
            error:       getError
            complete:    -> outstanding.value(outstanding.value() - 1)
          }

          outstanding.value(outstanding.value() + 1)

        if c.resVal
          complete(null, c.resVal)

          return {
            abort: ->
              return
          }
        else
          c.waiting.push(complete) unless added

          return {
            abort: ->
              return unless c.waiting
              c.waiting = c.waiting.filter((l) -> l isnt complete)

              if c.waiting.length is 0 and c.ajax
                c.ajax.abort()
                c.ajax = null
                delete cache[key]
                count--

              return
          }

      clear: ->
        cache = {}
        count = 0
        return
    }
}


dvl.snap = ({data, acc, value, trim, name}) ->
  throw 'No data given' unless data
  acc = dvl.wrap(acc or dvl.identity)
  value = dvl.wrap(value)
  trim = dvl.wrap(trim or false)
  name or= 'snaped_data'

  out = dvl.def(null).name(name)

  updateSnap = ->
    ds = data.value()
    a = acc.value()
    v = value.value()

    if ds and a and v
      if trim.value() and ds.length isnt 0 and (v < a(ds[0]) or a(ds[ds.length-1]) < v)
        minIdx = -1
      else
        minIdx = -1
        minDist = Infinity
        if ds
          for d,i in ds
            dist = Math.abs(a(d) - v)
            if dist < minDist
              minDist = dist
              minIdx = i

      minDatum = if minIdx < 0 then null else ds[minIdx]
      out.set(minDatum) unless out.value() is minDatum
    else
      out.set(null)

    dvl.notify(out)

  dvl.register({fn:updateSnap, listen:[data, acc, value, trim], change:[out], name:name+'_maker'})
  return out


dvl.hasher = (obj) ->
  updateHash = ->
    h = obj.value()
    window.location.hash = h unless window.location.hash == h

  dvl.register({fn:updateHash, listen:[obj], name:'hash_changer'})
  return


# Data # ------------------------------------------------

dvl.data = {}

dvl.data.min = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: d3.min
  }

dvl.data.max = (data, acc) ->
  acc or= dvl.identity
  return dvl.apply {
    args: [data, acc]
    update: true
    fn: d3.max
  }

# dvl.bind # --------------------------------------------------
do ->
  id_class_spliter = /(?=[#.:])/
  def_data_fn = dvl.const((d) -> [d])
  dvl.bind = ({parent, self, data, join, attr, style, text, html, on:argsOn, transition, transitionExit}) ->
    throw "'parent' not defiend" unless parent
    throw "'self' not defiend" unless typeof self is 'string'
    parts = self.split(id_class_spliter)
    nodeType = parts.shift()
    staticId = null
    staticClass = []
    for part in parts
      switch part[0]
        when '#'
          staticId = part.substring(1)
        when '.'
          staticClass.push part.substring(1)
        else
          throw "not currently supported in 'self' (#{part})"

    staticClass = staticClass.join(' ')

    parent = dvl.wrap(parent)
    data = dvl.wrap(data or def_data_fn)
    join = dvl.wrap(join)
    text = if text then dvl.wrap(text) else null
    html = if html then dvl.wrap(html) else null
    transition = dvl.wrap(transition)
    transitionExit = dvl.wrap(transitionExit)

    listen = [parent, data, join, text, html, transition, transitionExit]

    attrList = {}
    for k, v of attr
      v = dvl.wrap(v)
      if k is 'class' and staticClass
        v = dvl.op.concat(staticClass + ' ', v)

      listen.push(v)
      attrList[k] = v

    if staticClass and not attrList['class']
      attrList['class'] = dvl.const(staticClass)

    styleList = {}
    for k, v of style
      v = dvl.wrap(v)
      listen.push(v)
      styleList[k] = v

    onList = {}
    for k, v of argsOn
      v = dvl.wrap(v)
      listen.push(v)
      onList[k] = v

    out = dvl.def().name('selection')

    dvl.register {
      listen
      change: [out]
      fn: ->
        _parent = parent.value()
        return unless _parent

        force = parent.hasChanged() or data.hasChanged() or join.hasChanged()
        _data = data.value()
        _join = join.value()

        if _data
          _transition = transition.value()
          _transitionExit = transitionExit.value()

          # prep
          enter     = []
          preTrans  = []
          postTrans = []

          add1 = (fn, v) ->
            if v.hasChanged() or force
              preTrans.push  { fn, a1: v.getPrev() }
              postTrans.push { fn, a1: v.value() }
            else
              enter.push  { fn, a1: v.value() }
            return

          add2 = (fn, k, v) ->
            if v.hasChanged() or force
              enter.push     { fn, a1: k, a2: v.getPrev() }
              preTrans.push  { fn, a1: k, a2: v.getPrev() }
              postTrans.push { fn, a1: k, a2: v.value() }
            else
              enter.push     { fn, a1: k, a2: v.value() }
            return

          addO = (fn, k, v) ->
            if v.hasChanged() or force
              preTrans.push { fn, a1: k, a2: v.value() }
            else
              enter.push  { fn, a1: k, a2: v.value() }
            return

          add1('text', text)  if text
          add1('html', html)  if html
          add2('attr', k, v)  for k, v of attrList
          add2('style', k, v) for k, v of styleList
          addO('on', k, v)    for k, v of onList

          # d3 stuff
          s = _parent.selectAll(self).data(_data, _join)
          e = s.enter().append(nodeType)

          e[a.fn](a.a1, a.a2) for a in enter

          s[a.fn](a.a1, a.a2) for a in preTrans

          if _transition and _transition.duration?
            t = s.transition()
            t.duration(_transition.duration or 1000)
            t.delay(_transition.delay) if _transition.delay
            t.ease(_transition.ease)   if _transition.ease
          else
            t = s

          t[a.fn](a.a1, a.a2) for a in postTrans

          ex = s.exit().remove()
          out.set(s).notify() if not e.empty() or not ex.empty() or force
        else
          s = _parent.selectAll(self).remove()
          out.set(s).notify()

        return
    }

    return out


  dvl.bindSingle = ({parent, self, datum, attr, style, text, html, on:argsOn, transition}) ->
    if typeof self is 'string'
      throw "'parent' not defiend for string self" unless parent
      parts = self.split(id_class_spliter)
      nodeType = parts.shift()
      staticId = null
      staticClass = []
      for part in parts
        switch part[0]
          when '#'
            staticId = part.substring(1)
          when '.'
            staticClass.push part.substring(1)
          else
            throw "not currently supported in 'self' (#{part})"

      staticClass = staticClass.join(' ')

      self = dvl.valueOf(parent).append(nodeType)
      self.attr('id', staticId) is staticId
      self.attr('class', staticClass) is staticClass

    self = dvl.wrapVar(self)

    datum = dvl.wrap(datum)
    text = if text then dvl.wrap(text) else null
    html = if html then dvl.wrap(html) else null
    transition = dvl.wrap(transition)

    listen = [datum, text, html, transition]

    attrList = {}
    for k, v of attr
      v = dvl.wrap(v)
      if k is 'class' and staticClass
        v = dvl.op.concat(staticClass + ' ', v)

      listen.push(v)
      attrList[k] = v

    styleList = {}
    for k, v of style
      v = dvl.wrap(v)
      listen.push(v)
      styleList[k] = v

    onList = {}
    for k, v of argsOn
      v = dvl.wrap(v)
      listen.push(v)
      onList[k] = v

    dvl.register {
      listen
      change: [self]
      fn: ->
        sel = self.value()
        _datum = datum.value()
        force = datum.hasChanged()
        sel.datum(_datum) if force

        for k, v of attrList
          sel.attr(k, v.value()) if v.hasChanged() or force

        for k, v of styleList
          sel.style(k, v.value()) if v.hasChanged() or force

        for k, v of onList
          sel.on(k, v.value()) if v.hasChanged() or force

        sel.text(text.value()) if text and (text.hasChanged() or force)
        sel.html(html.value()) if html and (html.hasChanged() or force)

        self.notify() if force
        return
    }

    return self


dvl.chain = (f, h) ->
  f = dvl.wrap(f)
  h = dvl.wrap(h)

  out = dvl.def().name('chain')

  dvl.register {
    listen: [f, h]
    change: [out]
    fn: ->
      _f = f.value()
      _h = h.value()
      if _f and _h
        out.value((x) -> _h(_f(x)))
      else
        out.value(null)
      return
  }
  return out


do ->
  dvl_value = (v) -> v.value()
  dvl.op = dvl_op = (fn) ->
    liftedFn = lift(fn)
    return (args...) ->
      args = args.map(dvl.wrap)
      out = dvl.def()

      dvl.register {
        listen: args
        change: [out]
        fn: ->
          out.set(liftedFn.apply(null, args.map(dvl_value)))
          dvl.notify(out)
          return
      }

      return out

  op_to_lift = {
    'or': ->
      for arg in arguments
        return arg if arg
      return false

    'add': ->
      sum = 0
      for arg in arguments
        if arg?
          sum += arg
        else
          return null
      return sum

    'sub': ->
      sum = 0
      mult = 1
      for arg in arguments
        if arg?
          sum += arg * mult
          mult = -1
        else
          return null
      return sum

    'list': (args...) ->
      for arg in args
        return null unless arg?
      return args

    'concat': (args...) ->
      for arg in args
        return null unless arg?
      return args.join('')

    'iff': (cond, truthy, falsy) ->
      return if cond then truthy else falsy

    'iffEq': (lhs, rhs, truthy, falsy) ->
      return if lhs is rhs then truthy else falsy

    'iffLt': (lhs, rhs, truthy, falsy) ->
      return if lhs < rhs then truthy else falsy

    'makeTranslate': (x, y) ->
      return if x? and y? then "translate(#{x},#{y})" else null
  }

  dvl_op[k] = dvl_op(fn) for k, fn of op_to_lift
  return


clipId = 0
dvl.svg or= {}
dvl.svg.clipPath = ({parent, x, y, width, height}) ->
  x = dvl.wrap(x or 0)
  y = dvl.wrap(y or 0)

  clipId++
  myId = "cp#{clipId}"
  cp = dvl.valueOf(parent)
    .append('defs')
      .append('clipPath')
      .attr('id', myId)

  dvl.bind {
    parent: cp
    self: 'rect'
    attr: {
      x
      y
      width
      height
    }
  }

  return "url(##{myId})"


# misc # --------------------------------------------------

dvl.misc = {}
dvl.misc.mouse = (element, out) ->
  element = dvl.wrap(element)
  width   = dvl.wrap(width)
  height  = dvl.wrap(height)
  out     = dvl.wrapVar(out, 'mouse')

  recorder = ->
    _element = element.value()
    mouse = if _element and d3.event then d3.svg.mouse(_element.node()) else null
    out.value(mouse)
    return

  element.value()
    .on('mousemove', recorder)
    .on('mouseout', recorder)

  dvl.register {
    name: 'mouse_recorder'
    listen: [parent]
    change: [out]
    fn: recorder
  }

  return out


dvl.misc.delay = (data, time = 1) ->
  data = dvl.wrap(data)
  time = dvl.wrap(time)
  timer = null
  out = dvl.def()

  timeoutFn = ->
    out.value(data.value())
    timer = null
    return

  dvl.register {
    listen: [data, time]
    change: [out]
    name: 'timeout'
    fn: ->
      clearTimeout(timer) if timer
      timer = null
      if time.value()?
        t = Math.max(0, time.value())
        timer = setTimeout(timeoutFn, t)
      return
  }
  return out


# HTML # --------------------------------------------------

dvl.html = {}

##-------------------------------------------------------
##  Capture the size of something in HTML
##
dvl.html.resizer = ({selector, out, dimension, fn}) ->
  out = dvl.wrapVar(out)
  dimension = dvl.wrap(dimension or 'width')
  fn = dvl.wrap(fn or dvl.identity)

  onResize = ->
    _dimension = dimension.value()
    _fn = fn.value()
    if _dimension in ['width', 'height'] and _fn
      if selector
        e = jQuery(selector)
        val = e[_dimension]()
      else
        val = document.body[if _dimension is 'width' then 'clientWidth' else 'clientHeight']

      out.value(_fn(val))
    else
      out.value(null)

  $(window).resize onResize
  dvl.register {
    name: 'resizer'
    listen: [dimension, fn]
    change: [out]
    fn: onResize
  }
  return out

##-------------------------------------------------------
##  Output to an HTML attribute
##
dvl.html.out = ({selector, data, fn, format, invalid, hideInvalid, attr, style, text}) ->
  throw 'must have data' unless data
  data = dvl.wrap(data)
  format = format ? fn

  throw 'must have selector' unless selector
  selector = dvl.wrap(selector)

  format = dvl.wrap(format or dvl.identity)
  invalid = dvl.wrap(invalid or null)
  hideInvalid = dvl.wrap(hideInvalid or false)

  if attr
    what = dvl.wrap(attr)
    out = (selector, string) -> d3.select(selector).attr(what.value(), string)
  else if style
    what = dvl.wrap(style)
    out = (selector, string) -> d3.select(selector).style(what.value(), string)
  else if text
    out = (selector, string) -> d3.select(selector).text(string)
  else
    out = (selector, string) -> d3.select(selector).html(string)

  updateHtml = () ->
    s = selector.value()
    a = format.value()
    d = data.value()
    if s?
      if a? and d?
        sel = out(s, a(d))
        sel.style('display', null) if hideInvalid.value()
      else
        inv = invalid.value()
        out(s, inv)
        d3.select(s).style('display', 'none') if hideInvalid.value()
    return

  dvl.register({fn:updateHtml, listen:[data, selector, format], name:'html_out'})
  return


##-------------------------------------------------------
##
##  Create HTML list
##
dvl.html.list = ({selector, data, label, link, class:listClass, selection, selections, onSelect, onEnter, onLeave, icons, extras, classStr, sortFn}) ->
  throw 'must have selector' unless selector
  throw 'must have data' unless data
  selection  = dvl.wrapVar(selection, 'selection')
  selections = dvl.wrapVar(selections or [], 'selections')
  sortFn = dvl.wrap(sortFn)

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)
  link = dvl.wrap(link)

  icons or= []
  for i in icons
    i.position or= 'right'

  if listClass?
    listClass = dvl.wrap(listClass)
  else
    listClass = dvl.apply(
      [selection, selections]
      allowNull: true
      (_selection, _selections) ->
        if _selection
          if _selections
            return (value) ->
              (if value is _selection  then 'is_selection'  else 'isnt_selection') + ' ' +
              (if value in _selections then 'is_selections' else 'isnt_selections')
          else
            return (value) ->
              (if value is _selection  then 'is_selection'  else 'isnt_selection')
        else
          if _selections
            return (value) ->
              (if value in _selections then 'is_selections' else 'isnt_selections')
          else
            return null
    )

  ul = d3.select(selector).append('ul').attr('class', classStr)

  onClick = (val, i) ->
    return if onSelect?(val, i) is false
    linkVal = link.value()?(val)
    selection.set(val)

    sl = (selections.value() or []).slice()
    i = sl.indexOf(val)
    if i is -1
      sl.push(val)
      _sortFn = sortFn.value()
      if typeof _sortFn is 'function'
        sl.sort(_sortFn)
      else
        sl.sort()
    else
      sl.splice(i,1)
    selections.set(sl)

    dvl.notify(selection, selections)
    window.location.href = linkVal if linkVal
    return

  dvl.register {
    name: 'update_html_list'
    listen: [data, label, link]
    fn: ->
      _data  = data.value()
      _label = label.value()
      _link  = link.value()
      _class = listClass.value()

      return unless _data

      addIcons = (el, position) ->
        icons.forEach (icon) ->
          return unless icon.position is position

          classStr = 'icon_cont ' + position
          classStr += ' ' + icon.classStr if icon.classStr

          el.append('div')
            .attr('class', classStr)
            .attr('title', icon.title)
            .on('click', (val, i) ->
              d3.event.stopPropagation() if icon.onSelect?(val, i) is false
              return
            ).on('mouseover', (val, i) ->
              d3.event.stopPropagation() if icon.onEnter?(val, i) is false
              return
            ).on('mouseout', (val, i) ->
              d3.event.stopPropagation() if icon.onLeave?(val, i) is false
              return
            ).append('div')
              .attr('class', 'icon')

          return
        return

      sel = ul.selectAll('li').data(_data)
      a = sel.enter().append('li').append('a')

      addIcons a, 'left'
      a.append('span')
      addIcons a, 'right'

      cont = sel
        .attr('class', _class)
        .on('click', onClick)
        .on('mouseover', onEnter)
        .on('mouseout', onLeave)
        .select('a')
          .attr('href', _link)


      cont.select('span').text(_label)

      sel.exit().remove()
      return
  }

  dvl.register {
    name: 'update_class_list'
    listen: [listClass]
    fn: ->
      _class = listClass.value()
      ul.selectAll('li').attr('class', _class)
  }

  return {
    selection
    selections
    node: ul.node()
  }


dvl.html.dropdownList = ({selector, data, label, selectionLabel, link, class:listClass, selection, selections, onSelect, onEnter, onLeave, classStr, menuAnchor, menuOffset, title, icons, sortFn, keepOnClick}) ->
  throw 'must have selector' unless selector
  throw 'must have data' unless data
  selection = dvl.wrapVar(selection, 'selection')
  selections = dvl.wrapVar(selections, 'selections')
  menuAnchor = dvl.wrap(menuAnchor or 'left')
  menuOffset = dvl.wrap(menuOffset or { x:0, y:0 })

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)
  selectionLabel = dvl.wrap(selectionLabel or label)
  link = dvl.wrap(link)

  title = dvl.wrap(title) if title
  icons or= []

  menuOpen = false
  getClass = ->
    (classStr ? '') + ' ' + (if menuOpen then 'open' else 'closed')

  divCont = d3.select(selector)
    .append('div')
    .attr('class', getClass())
    .style('position', 'relative')

  selectedDiv = divCont.append('div')
    .attr('class', 'selected')

  valueSpan = selectedDiv.append('span')

  open = ->
    sp = $(selectedDiv.node())
    pos = sp.position()
    height = sp.outerHeight(true)
    anchor = menuAnchor.value()
    offset = menuOffset.value()
    menuCont
      .style('display', null)
      .style('top', (pos.top + height + offset.y) + 'px')

    if anchor is 'left'
      menuCont.style('left', (pos.left + offset.x) + 'px')
    else
      menuCont.style('right', (pos.left - offset.x) + 'px')

    menuOpen = true
    divCont.attr('class', getClass())
    return

  close = ->
    menuCont.style('display', 'none')
    menuOpen = false
    divCont.attr('class', getClass())
    return

  myOnSelect = (text, i) ->
    close() unless keepOnClick
    return onSelect?(text, i)

  icons.forEach (icon) ->
    icon_onSelect = icon.onSelect
    icon.onSelect = (val, i) ->
      close() unless keepOnClick
      return icon_onSelect?(val, i)
    return

  menuCont = divCont.append('div')
    .attr('class', 'menu_cont')
    .style('position', 'absolute')
    .style('z-index', 1000)
    .style('display', 'none')

  dvl.html.list {
    selector: menuCont.node()
    data
    label
    link
    class: listClass
    sortFn
    selection
    selections
    onSelect: myOnSelect
    onEnter
    onLeave
    classStr: 'list'
    icons
  }

  $(window).bind('click', (e) ->
    return if $(menuCont.node()).find(e.target).length

    if selectedDiv.node() is e.target or $(selectedDiv.node()).find(e.target).length
      if menuOpen
        close()
      else
        open()
    else
      close()

    return {
      node: divCont.node()
      selection
      selections
    }
  ).bind('blur', close)

  updateSelection = ->
    if title
      valueSpan.text(title.value())
    else
      sel = selection.value()
      selLabel = selectionLabel.value()
      valueSpan.text(selLabel(sel))
    return

  dvl.register {
    fn:updateSelection
    listen:[selection, selectionLabel, title]
    name:'selection_updater'
  }

  return {
    node: divCont.node()
    menuCont: menuCont.node()
    selection
  }


##-------------------------------------------------------
##
##  Select (dropdown box) made with HTML
##
dvl.html.select = ({parent, data, label, selection, onChange, classStr, visible}) ->
  throw 'must have parent' unless parent
  throw 'must have data' unless data
  selection = dvl.wrapVar(selection, 'selection')
  visible = dvl.wrap(visible ? true)

  data = dvl.wrap(data)
  label = dvl.wrap(label or dvl.identity)

  selChange = ->
    _data = data.value()
    return unless _data
    _selectEl = selectEl.value()
    i = _selectEl.property('value')
    val = _data[i]
    return if onChange?(val) is false
    selection.value(val)
    return

  selectEl = dvl.bindSingle {
    parent
    self: 'select'
    attr: {
      class: classStr or null
    }
    style: {
      display: dvl.op.iff(visible, null, 'none')
    }
    on: {
      change: selChange
    }
  }

  dvl.bind {
    parent: selectEl
    self: 'option'
    data
    attr: {
      value: (d,i) -> i
    }
    text: label
  }

  dvl.register {
    listen: [data, selection]
    fn: ->
      _data = data.value()
      _selection = selection.value()
      return unless _data
      idx = _data.indexOf(_selection)
      _selectEl = selectEl.value()
      if _selectEl.property('value') isnt idx
        _selectEl.property('value', idx)
      return
  }

  selChange()
  return selection



dvl.compare = (acc, reverse, ignoreCase) ->
  acc = dvl.wrap(acc or dvl.ident)
  reverse = dvl.wrap(reverse or false)
  ignoreCase = dvl.wrap(ignoreCase or false)
  return dvl.apply {
    args: [acc, reverse, ignoreCase]
    fn: (acc, reverse, ignoreCase) ->
      toStr = if ignoreCase then (x) -> String(x).toLowerCase() else String

      numCmp = if reverse
        (a,b) -> b - a
      else
        (a,b) -> a - b

      strCmp = if reverse
        (a,b) -> toStr(b).localeCompare(toStr(a))
      else
        (a,b) -> toStr(a).localeCompare(toStr(b))

      return (a,b) ->
        va = acc(a)
        vb = acc(b)
        t = typeof va
        return if t is 'number' then numCmp(va,vb) else strCmp(va,vb)
  }


##-------------------------------------------------------
##
##  Table made with HTML
##
##  This module draws an HTML table that can be sorted
##
##  parent:      Where to append the table.
## ~data:        The data displayed.
##  classStr:    The class to add to the table.
## ~rowClassGen: The generator for row classes
## ~visible:     Toggles the visibility of the table. [true]
##  columns:     A list of columns to drive the table.
##    column:
##      id:               The id by which the column will be identified.
##     ~title:            The title of the column header.
##     ~headerTooltip:    The popup tool tip (title element text) of the column header.
##      classStr:         The class given to the 'th' and 'td' elements in this column, if not specified will default to the id.
##      cellClassGen:     The class generator for the cell
##     ~cellClick:        The generator of click handlers
##     ~value:            The value of the cell
##      sortable:         Toggles wheather the column is sortable or not. [true]
##     ~compare:          The generator that will drive the sorting, if not provided then gen will be used instead. [gen]
##     ~compareModes:        ['none', 'up', 'down']
##     ~hoverGen:         The generator for the (hover) title.
##     ~showIndicator:    Toggle the display of the sorting indicator for this column. [true]
##     ~reverseIndicator: Reverses the asc / desc directions of the indicator for this column. [false]
##     ~visible:          Toggles the visibility of the column
##
##  sort:
##   ~on:              The id of the column on which to sort.
##   ~onIndicator:     The id of the column on which the indicator is palced (defaults to sort.on)
##   ~order:           The order of the sort. Must be one of {'asc', 'desc', 'none'}.
##   ~modes:           The order rotation that is allowed. Must be an array of [{'asc', 'desc', 'none'}].
##   ~autoOnClick:     Toggle wheather the table will be sorted (updating sort.on and/or possibly sort.order) automaticaly when clicked. [true]
##   ~indicator:       [true / false]
##
## ~showHeader:        Toggle showing the header [true]
## ~onHeaderClick:     Callback or url when the header of a column is clicked.
## ~headerTooltip:     The default herder tooltip (title element text).
## ~rowLimit:          The maximum number of rows to show; if null all the rows are shown. [null]
##
do ->
  default_compare_modes = ['up', 'down']
  dvl.html.table = ({parent, data, sort, classStr, rowClass, rowLimit, columns, on:onRow}) ->
    table = dvl.bindSingle {
      parent
      self: 'table'
      attr: {
        class: classStr
      }
    }

    sort = sort or {}
    sortOn = dvl.wrapVar(sort.on)
    sortDir = dvl.wrapVar(sort.dir)
    sortOnIndicator = dvl.wrapVar(sort.onIndicator ? sortOn)

    headerCol = []
    bodyCol = []
    compareMap = {}
    compareList = [sortOn, sortDir]
    for c in columns
      if c.sortable
        if c.compare?
          comp = dvl.wrap(c.compare)
        else
          comp = dvl.compare(c.value)
        compareMap[c.id] = comp
        compareList.push comp

        if not c.compareModes?[0]
          c.compareModes = default_compare_modes

      headerCol.push {
        id:       c.id
        title:    c.title
        class:    c.class
        visible:  c.visible
        tooltip:  c.headerTooltip
      }
      bodyCol.push {
        id:       c.id
        class:    c.class
        visible:  c.visible
        value:    c.value
        hover:    c.hover
        render:   c.render
        on:       c.on
      }

    compare = dvl.def(null)
    dvl.register {
      listen: compareList
      change: [compare]
      fn: ->
        _sortOn = sortOn.value()
        _sortDir = sortDir.value()

        if _sortOn?
          cmp = compareMap[_sortOn]?.value()
          if cmp and _sortDir is 'down'
            oldCmp = cmp
            cmp = (a,b) -> oldCmp(b,a)
          compare.value(cmp)
        else
          compare.value(null)
        return
    }

    dvl.html.table.header {
      parent: table
      columns: headerCol
      onClick: (id) ->
        column = null
        for c in columns
          if c.id is id
            column = c
            break

        return unless column and column.sortable

        compareModes = column.compareModes
        if id is sortOn.value()
          sortDir.set(compareModes[(compareModes.indexOf(sortDir.value())+1) % compareModes.length])
          dvl.notify(sortDir)
        else
          sortOn.set(id)
          sortDir.set(compareModes[0])
          dvl.notify(sortOn, sortDir)

        return
    }

    dvl.html.table.body {
      parent: table
      classStr: 'data'
      data
      rowClass
      rowLimit
      columns: bodyCol
      compare
      on:      onRow
    }

    return {}


  ##-------------------------------------------------------
  ##
  ##  HTML table header (thead)
  ##
  ##  parent:      Where to append the table.
  ## ~onClick:     The click handler
  ##  columns:
  ##   ~title:       The title of the column.
  ##   ~class:       The class of the column
  ##   ~tooltip:     The tooltip for the column
  ##   ~visible:     Is this visible
  ##   ~indicator:   The column indicator
  ##
  dvl.html.table.header = ({parent, columns, onClick}) ->
    throw 'there needs to be a parent' unless parent
    onClick = dvl.wrap(onClick)

    thead = dvl.valueOf(parent).append('thead').append('tr')

    listen = [onClick]
    newColumns = []
    for c in columns
      newColumns.push(nc = {
        id:        c.id
        title:     dvl.wrap(c.title)
        class:     dvl.wrap(c.class)
        visible:   dvl.wrap(c.visible ? true)
        tooltip:   dvl.wrap(c.tooltip)
        indicator: dvl.wrap(c.indicator) if c.indicator
      })
      listen.push nc.title, nc.class, nc.visible, nc.tooltip, nc.indicator

    columns = newColumns

    # Init step
    sel = thead.selectAll('th').data(columns)
    enterTh = sel.enter().append('th')
    enterTh.append('span')
    enterTh.append('div').attr('class', 'indicator').style('display', 'none')

    sel.exit().remove()

    dvl.register {
      name: 'header_render'
      listen
      fn: ->
        for c,i in columns
          sel = thead.select("th:nth-child(#{i+1})")
          visibleChanged = c.visible.hasChanged()
          if c.visible.value()
            sel.datum(c)
            sel.attr('class', c.class.value())       if c.class.hasChanged() or visibleChanged
            sel.attr('title', c.tooltip.value())     if c.tooltip.hasChanged() or visibleChanged
            sel.attr('title', c.tooltip.value())     if c.tooltip.hasChanged() or visibleChanged
            sel.style('display', null)             if visibleChanged
            sel.on('click', (d) -> onClick.value()?(d.id)) if onClick.hasChanged() or visibleChanged
            sel.select('span').text(c.title.value()) if c.title.hasChanged() or visibleChanged

            if c.indicator and (c.indicator.hasChanged() or visibleChanged)
              _indicator = c.indicator.value()
              ind = sel.select('div.indicator')
              if _indicator
                ind.style('display', null).attr('class', 'indicator ' + _indicator)
              else
                ind.style('display', 'none')
          else
            sel.style('display', 'none')           if visibleChanged

        return
    }

    return

  ##-------------------------------------------------------
  ##
  ##  HTML table body (tbody)
  ##
  ##  parent:      Where to append the table.
  ## ~data:        The data displayed.
  ## ~compare:        The function to sort the data on
  ## ~rowClass       The class of the row
  ## ~rowLimit:          The maximum number of rows to show; if null all the rows are shown. [null]
  ##  columns:
  ##   ~value:       The value of the cell
  ##   ~class:       The class of the column
  ##   ~hover:       The hover
  ##   ~visible:     This this column shown?
  ##    on:          Whatever on events you want
  ##
  dvl.html.table.body = ({parent, data, compare, rowClass, classStr, rowLimit, columns, on:onRow}) ->
    throw 'there needs to be a parent' unless parent
    throw 'there needs to be data' unless data
    tbody = dvl.valueOf(parent).append('tbody').attr('class', classStr)

    compare = dvl.wrap(compare)
    rowClass = dvl.wrap(rowClass) if rowClass?
    rowLimit = dvl.wrap(rowLimit)
    listen = [data, compare, rowClass, rowLimit]
    change = []

    onRowNew = {}
    for k,v of onRow
      v = dvl.wrap(v)
      listen.push v
      onRowNew[k] = v
    onRow = onRowNew

    newColumns = []
    for c in columns
      newColumns.push(nc = {
        id:      c.id
        class:   dvl.wrap(c.class)
        visible: dvl.wrap(c.visible ? true)
        hover:   dvl.wrap(c.hover)
        value:   dvl.wrap(c.value)
      })
      # don't listen to value which is handled by the render
      listen.push nc.class, nc.visible, nc.hover

      nc.render = c.render or 'text'

      nc.on = {}
      for k,v of c.on
        v = dvl.wrap(v)
        listen.push v
        nc.on[k] = v

      change.push(nc.selection = dvl.def().name("#{c.id}_selection"))

    columns = newColumns

    dvl.register {
      name: 'body_render'
      listen
      change
      fn: ->
        dataSorted = data.value() or []

        _compare = compare.value()
        dataSorted = dataSorted.slice().sort(_compare) if _compare

        _rowLimit = rowLimit.value()
        dataSorted = dataSorted.slice(0, _rowLimit) if _rowLimit?

        rowSel = tbody.selectAll('tr').data(dataSorted)
        enterRowSel = rowSel.enter().append('tr')
        rowSel.exit().remove()
        if rowClass
          _rowClass = rowClass.value()
          rowSel.attr('class', _rowClass)

        for k,v of onRow
          rowSel.on(k, v.value())

        colSel = rowSel.selectAll('td').data(columns)
        colSel.enter().append('td')
        colSel.exit().remove()

        for c,i in columns
          sel = tbody.selectAll("td:nth-child(#{i+1})").data(dataSorted)
          visibleChanged = c.visible.hasChanged() or data.hasChanged()
          if c.visible.value()
            sel.attr('class', c.class.value()) if c.class.hasChanged() or visibleChanged
            sel.attr('title', c.hover.value()) if c.hover.hasChanged() or visibleChanged
            sel.style('display', null)       if visibleChanged

            for k,v of c.on
              sel.on(k, v.value()) if v.hasChanged() or visibleChanged

            c.selection.set(sel).notify()
          else
            sel.style('display', 'none')     if visibleChanged

        return
    }

    for c in columns
      render = if typeof c.render is 'function' then c.render else dvl.html.table.render[c.render]
      render.call(c, c.selection, c.value)

    return


  dvl.html.table.render = {
    text: (selection, value) ->
      dvl.register {
        listen: [selection, value]
        fn: ->
          _selection = selection.value()
          _value = value.value()
          if _selection? and _value
            _selection.text(_value)
          return selection
      }
      return

    html: (selection, value) ->
      dvl.register {
        listen: [selection, value]
        fn: ->
          _selection = selection.value()
          _value = value.value()
          if _selection? and _value
            _selection.html(_value)
          return selection
      }
      return


    aLink: ({href}) -> (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'a.link'
        attr: {
          href: href
        }
        text: value
      }

    img: (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'img'
        attr: {
          src: value
        }
      }

    imgDiv: (selection, value) ->
      return dvl.bind {
        parent: selection
        self: 'div'
        attr: {
          class: value
        }
      }

    sparkline: ({width, height, x, y, padding}) ->
      padding ?= 0
      return (selection, value) ->
        lineFn = dvl.apply {
          args: [x, y, padding]
          fn: (x, y, padding) -> (d) ->
            mmx = dvl.util.getMinMax(d, ((d) -> d[x]))
            mmy = dvl.util.getMinMax(d, ((d) -> d[y]))
            sx = d3.scale.linear().domain([mmx.min, mmx.max]).range([padding, width-padding])
            sy = d3.scale.linear().domain([mmy.min, mmy.max]).range([height-padding, padding])
            return d3.svg.line().x((dp) -> sx(dp[x])).y((dp) -> sy(dp[y]))(d)
        }

        dataFn = dvl.apply {
          args: value
          fn: (value) -> (d,i) -> [value(d,i)]
        }

        svg = dvl.bind {
          parent: selection
          self: 'svg.sparkline'
          data: dataFn
          attr: {
            width
            height
          }
        }

        return dvl.bind {
          parent: svg
          self: 'path'
          data: (d) -> [d]
          attr: {
            d: lineFn
          }
        }
  }
