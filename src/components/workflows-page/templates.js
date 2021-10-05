export const noop = `description: A simple 'no-op' state that returns 'Hello world!'
states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`

export const action = `description: A simple 'action' state that sends a get request"
functions:
- id: get
  image: vorteil/request:v6
  type: reusable
states:
- id: getter 
  type: action
  action:
    function: get
    input: 
      method: "GET"
      url: "https://jsonplaceholder.typicode.com/todos/1"
`

export const consumeEvent = `functions:
- id: greeter
  image: vorteil/greeting:v2
  type: reusable
description: A simple 'consumeEvent' state that listens for the greetingcloudevent generated from the template 'generate-event'.
states:
- id: ce
  type: consumeEvent
  event:
    type: greetingcloudevent
  timeout: PT1H
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform:
    greeting: jq(.return.greeting)
`

export const delay =`description: A simple 'delay' state that waits for 5 seconds
states:
- id: delay
  type: delay
  duration: PT5S
`

export const error =`description: A simple 'error' state workflow that checks an email attempts to validate it.
states:
- id: data
  type: noop
  transform: 
    email: "trent.hilliamvorteil.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: error
  error: direktiv.schema.*
  message: "email '.email' is not valid"
- id: email-valid
  type: noop
  transform: 
    result: "Email is valid."
`

export const foreach =`description: A simple 'foreach' state that solves expressions
functions: 
- id: solve
  image: vorteil/solve:v2
  type: reusable
states:
- id: data
  type: noop
  transform: 
    expressions: ["4+10", "15-14", "100*3","200/2"] 
  transition: solve
- id: solve
  type: foreach
  array: 'jq(.expressions[] | { expression: . })'
  action:
    function: solve
    input:
      x: jq(.expression)
  transform:
    solved: jq(.return)
`

export const generateEvent =`description: A simple 'generateEvent' state that sends data to a greeting listener.
states:
- id: generate
  type: generateEvent
  event:
    type: greetingcloudevent
    source: Direktiv
    data: 
      name: "Trent"
`

export const generateSolveEvent =`description: A simple 'generateEvent' state that sends an expression to a solve listener.
states:
- id: generate
  type: generateEvent
  event:
    type: solveexpressioncloudevent
    source: Direktiv
    data: 
      x: "10+5"
`

export const getAndSet=`description: "Simple Counter getter and setter variable example"
states:
  - id: counter-get
    type: getter 
    transition: counter-set
    variables:
    - key: ExampleVariableCounter
      scope: workflow
    transform: 'jq(. += {"newCounter": (.var.ExampleVariableCounter + 1)})'
  - id: counter-set
    type: setter
    variables:
      - key: ExampleVariableCounter
        scope: workflow 
        value: 'jq(.newCounter)'
`

export const parallel=`description: A simple 'parallel' state workflow that runs solve container to solve expressions.
functions: 
- id: solve
  image: vorteil/solve:v2
  type: reusable
states:
- id: run
  type: parallel
  actions:
  - function: solve
    input: 
      x: "10*2"
  - function: solve
    input:
      x: "10%2"
  - function: solve
    input:
      x: "10-2"
  - function: solve
    input:
      x: "10+2"
  # Mode 'and' waits for all actions to be completed
  # Mode 'or' waits for the first action to be completed
  mode: and
`

export const validate =`description: A simple 'validate' state workflow that checks an email
states:
- id: data
  type: noop
  transform:
    email: "trent.hilliam@vorteil.io"
  transition: validate-email
- id: validate-email
  type: validate
  subject: jq(.)
  schema:
    type: object
    properties:
      email:
        type: string
        format: email
  catch:
  - error: direktiv.schema.*
    transition: email-not-valid 
  transition: email-valid
- id: email-not-valid
  type: noop
  transform:
    result: "Email is not valid."
- id: email-valid
  type: noop
  transform:
    result: "Email is valid."
`

export const zwitch = `description: A simple 'switch' state that checks whether the age provided is older than 18.
states:
- id: data
  type: noop
  transform:
    age: 27
  transition: check
- id: check
  type: switch
  conditions:
  - condition: 'jq(.age > 18)'
    transition: olderthan18
  defaultTransition: youngerthan18
- id: olderthan18
  type: noop
  transform: 
    result: "You are older than 18."
- id: youngerthan18
  type: noop
  transform: 
    result: "You are younger than 18."
`

export const eventXor = `functions:
- id: greeter
  image: vorteil/greeting:v2
  type: reusable
- id: solve2
  image: vorteil/solve:v2
  type: reusable
description: A simple 'eventXor' that waits for events to be received.
states:
- id: event-xor
  type: eventXor
  timeout: PT1H
  events:
  - event: 
      type: solveexpressioncloudevent
    transition: solve
  - event: 
      type: greetingcloudevent
    transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
- id: solve
  type: action
  action:
    function: solve2
    input: jq(.solveexpressioncloudevent.data)
  transform: 
    solvedexpression: jq(.return)
`

export const eventAnd =`functions:
- id: greeter
  image: vorteil/greeting:v2
  type: reusable
- id: solve
  image: vorteil/solve:v2
  type: reusable
description: A simple 'eventAnd' that waits for events to be received.
states:
- id: event-and
  type: eventAnd
  timeout: PT1H
  events:
  - type: greetingcloudevent
  - type: solveexpressioncloudevent
  transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
    ceevent: jq(.solveexpressioncloudevent)
  transition: solve
- id: solve
  type: action
  action:
    function: solve
    input: jq(.ceevent.data)
  transform: 
    msggreeting: jq(.greeting)
    solvedexpression: jq(.return)
`

