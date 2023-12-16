// import { TODOLIST_KEY } from "./global.js"
import { useClickInstall } from "./composables/click-install.js"
import Modal from "./modal.js"
import { 
  safeParseJson, 
  checkPendingTodoIsOvertime,
  splitDateAndTime,
 } from "./utils.js"

const TODOLIST_KEY = 'todolist'
const OVERTIME_TODOLIST_KEY = 'overtime.todolist'

const TODO_CREATED_EVENT = 'todo-created'
const TODO_DELETED_EVENT = 'todo-deleted'
const TODO_STATUS_CHANGED = 'todo-set-done'

const FORM_ID_SELECTOR = 'create-form'
const WRAPPER_ID_SELECTOR = 'todo-list-wrapper'
const OVERTIME_TODO_ID_SELECTOR = 'overtime-list'

const overtimeModal = new Modal()
overtimeModal.setTitle('Upps Beberapa Todo Terlewat')

function setPendingToOvertimeTodo() {
  const json = localStorage.getItem(TODOLIST_KEY)
  const todos = safeParseJson(json, [])
  const overtimeTodos = []
  const updatedTodos = todos.map((todo) => {
    const isOvertime = checkPendingTodoIsOvertime(todo)
    if (isOvertime) {
      todo.status = 'overtime'
      overtimeTodos.push(todo)
    }
    return todo
  })

  localStorage.setItem(TODOLIST_KEY, JSON.stringify(updatedTodos))
  localStorage.setItem(OVERTIME_TODOLIST_KEY, JSON.stringify(overtimeTodos))

  return overtimeTodos
}


function showModalOvertime() {
  const overtimeTodos = setPendingToOvertimeTodo()
  if (overtimeTodos.length == 0) return
  const node = makeTodoElements(overtimeTodos)
  overtimeModal.setBody(node)
  overtimeModal.showModal()
}

function makeTodoElements(todos) {
  const listWrapper = document.createElement('ul')
  listWrapper.className = 'todo-list-wrapper'

  todos.forEach((todo) => {
    // show the element
    const list = makeTodoElement(todo)
    listWrapper.appendChild(list)
  })

  return listWrapper
}

function getTodoList() {
  const data = localStorage.getItem(TODOLIST_KEY)

  if (data == null) {
    localStorage.setItem(TODOLIST_KEY, JSON.stringify([]))
  }

  const todos = safeParseJson(data, [])

  // get 1 - 5 todo
  const todolist = todos.sort((a, b) => {
    return (new Date(b.start)) - (new Date(a.start))
  })

  return todolist
}

function showTodoList(filterStatus = null, search = null) {
  let todolist = getTodoList()

  console.log(todolist)
  if (filterStatus != null) {
    todolist = todolist.filter((todo) => todo.status === filterStatus)
  }

  const todolistWrapper = document.getElementById(WRAPPER_ID_SELECTOR)

  // rerender
  todolistWrapper.innerHTML = ''

  todolist.forEach((todo) => {
    const todolist = makeTodoElement(todo)
    todolistWrapper.appendChild(todolist)
  })
}

/** 
 * @param {{ 
 *  title: string, 
 *  start: string,
 *  start_time: string,
 *  consequences?: string, 
 *  status: 'pending'|'overtime'|'done' 
 * }} todo
 * */
function makeTodoElement(todo) {
  const wrapper = document.createElement('li')
  wrapper.className = 'todo-list'
  
  const header = document.createElement('div')
  const title = document.createElement('h4')
  
  header.className = 'todo-list__header'
  title.className = 'todo-list__title'
  title.innerText = todo.title

  // setup btn
  const todoAction = document.createElement('div')
  const deleteTodoBtn = document.createElement('button')
  const close = document.createElement('img')


  if (todo.status != 'done') {
    const doneTodoBtn = document.createElement('button')
    const done = document.createElement('img')
    done.src = '../icons/done.svg'  
    doneTodoBtn.append(document.createTextNode('Selesai'), done)
    doneTodoBtn.className = 'btn btn-success todo-action__btn'
    doneTodoBtn.addEventListener('click', () => setDoneStatus(todo))
    todoAction.append(doneTodoBtn)
  }


  todoAction.className = 'todo-action'
  deleteTodoBtn.className = 'btn btn-danger todo-action__btn'
  close.src = '../icons/close.svg'

  deleteTodoBtn.append(document.createTextNode('Hapus'), close)
  todoAction.append(deleteTodoBtn)

  deleteTodoBtn.addEventListener('click', () => deleteTodo(todo))

  header.append(title, todoAction)

  const start = document.createElement('p')
  const startTime = document.createElement('p')
  const consequences = document.createElement('p')
  const label = document.createElement('div')

  start.innerHTML = '<strong>Dimulai Tanggal: </strong>'

  const [date, time] = splitDateAndTime(todo.start)

  start.appendChild(document.createTextNode(date))

  startTime.innerHTML = '<strong>Jam: </strong>'
  startTime.appendChild(document.createTextNode(time))
  
  if (todo.consequences != '') {
    consequences.innerHTML = '<strong>Konsekuensi: </strong>'
    consequences.appendChild(document.createTextNode(todo.consequences))
  }

  label.className = {
    'pending':'todo-label--pending',
    'overtime': 'todo-label--overtime',
    'done': 'todo-label--done'
  }[todo.status] || 'todo-label--pending'

  label.classList.add('todo-label')
  label.innerText = todo.status

  wrapper.append(header,start,startTime, consequences, label)
  return wrapper
}

function updateTodo(updatedTodo, storageKey) {
  const index = getIndexOfTodoFromStorage(updatedTodo, storageKey)
  if (index === -1) {
    return false
  }

  const json = localStorage.getItem(storageKey)
  const prev = safeParseJson(json, [])

  prev[index] = updatedTodo
  localStorage.setItem(storageKey, JSON.stringify(prev))
  return true
}

function updateTodoInOvertimeStorage(updatedTodo) {
  return updateTodo(updatedTodo, OVERTIME_TODOLIST_KEY)
}

function updateTodoInMainStorage(updatedTodo) {
 return updateTodo(updatedTodo, TODOLIST_KEY)
}

function setDoneStatus(todo) {
  todo.status = 'done'
  updateTodoInMainStorage(todo)
  updateTodoInOvertimeStorage(todo)
  document.dispatchEvent(new CustomEvent(TODO_STATUS_CHANGED, { detail: todo }))
}

function addNewTodoElement(newTodo) {
  const todolistWrapper = document.getElementById(WRAPPER_ID_SELECTOR)
  const todolist = makeTodoElement(newTodo)
  todolist.classList.add('cool-effect')
  todolistWrapper.insertBefore(todolist, todolistWrapper.firstChild)
}

function getTodoFormData(formElement) {
  const formData = new FormData(formElement)
  formData.set('status', 'pending')
  const payload = Object.fromEntries(formData.entries())
  return payload
}

function saveTodoList(formElement) {
  const payload = getTodoFormData(formElement)
  const json = localStorage.getItem(TODOLIST_KEY)
  const prev = safeParseJson(json, [])

  prev.unshift(payload)
  localStorage.setItem(TODOLIST_KEY, JSON.stringify(prev))
  document.dispatchEvent((new CustomEvent(TODO_CREATED_EVENT, {detail: payload})))
}

function getIndexOfTodoFromStorage(todo, storageKey = TODOLIST_KEY) {
  const json = localStorage.getItem(storageKey)
  const todos = safeParseJson(json, [])
  
  const index = todos.findIndex((item) => {
    console.log(item.created_at, todo.created_at, item.created_at == todo.created_at)
    return item.created_at == todo.created_at
  })

  return index
}

function deleteTodoFromStorage(storageKey, todo) {
  const index = getIndexOfTodoFromStorage(todo, storageKey)
  const json = localStorage.getItem(storageKey)
  const todos = safeParseJson(json, [])
  
  // const index = todos.findIndex((item) => {
  //   console.log(item.created_at, todo.created_at, item.created_at == todo.created_at)
  //   return item.created_at == todo.created_at
  // })
  // console.log(todos[0].created_at, todo.created_at)
  if (index === -1) {
    return null
  }
  
  const deleted = todos.splice(index, 1)
  localStorage.setItem(storageKey, JSON.stringify(todos))

  return deleted
}

function deleteOvertimeTodo(todo) {
  return deleteTodoFromStorage(OVERTIME_TODOLIST_KEY, todo)
}

function deleteMainTodo(todo) {
  return deleteTodoFromStorage(TODOLIST_KEY, todo)
}

function deleteTodo(todo) {
  const deleted = deleteMainTodo(todo)
  deleteOvertimeTodo(todo)

  const deleteEvent = new CustomEvent(TODO_DELETED_EVENT, { detail: deleted })
  document.dispatchEvent(deleteEvent)

  return deleted
}

function clearForm() {
  const formElement = document.getElementById(FORM_ID_SELECTOR)
  const inputs = formElement.querySelectorAll('input')
  inputs.forEach((input) => {
    input.value = ''
    if (input.name == 'created_at') {
      setValueCreatedAt(input)
    }
  })
}

function addSubmitFormListener() {
  const formElement = document.getElementById(FORM_ID_SELECTOR)
  formElement.addEventListener('submit', (e) => {
    e.preventDefault()
    saveTodoList(formElement)
  })
}

function addTodoCreatedLisener() {
  document.addEventListener(TODO_CREATED_EVENT, (event) => {
    const { detail } = event
    addNewTodoElement(detail)
    clearForm()
  })
}

function addTodoDeletedListener() {
  document.addEventListener(TODO_DELETED_EVENT, () => {
    showTodoList()

    // const json = localStorage.getItem(OVERTIME_TODOLIST_KEY)
    // const todos = safeParseJson(json, [])
    // if they delete todo in overtime modal
    const overtimeTodos = setOvertimeList(overtimeModal)
    // overtimeModal.setBody(overtimeTodos)

    if (overtimeTodos.firstChild == null) {
      overtimeModal.hideModal()
    }
  })
}

function addTodoStatusChanged() {
  document.addEventListener(TODO_STATUS_CHANGED, () => {
    showTodoList() 
    setOvertimeList(overtimeModal)
  })
}

function setOvertimeList(overtimeModal) {
  const json = localStorage.getItem(OVERTIME_TODOLIST_KEY)
  const todos = safeParseJson(json, [])

  // if they delete todo in overtime modal
  const overtimeTodos = makeTodoElements(todos)
  overtimeModal.setBody(overtimeTodos)

  return overtimeTodos
}

function addHiddenCreatedAtInput() {
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name= 'created_at'
  // input.value = (new Date()).toLocaleString()
  setValueCreatedAt(input)
  document.getElementById(FORM_ID_SELECTOR).appendChild(input)
}


function setValueCreatedAt(input) {
  input.value = (new Date()).toLocaleString()
  return input
}

function setUpPickerJS() {
  const dateEl = document.getElementById('start')
  flatpickr(dateEl, { dateFormat: 'd/m/Y H:i', enableTime: true, disableMobile:true })
}

function setUpInputs() {
  addHiddenCreatedAtInput()
  setUpPickerJS()
}

function main() {
  setUpInputs()
  showModalOvertime() // IF overtime is null then modal will not showed
  addSubmitFormListener()
  addTodoCreatedLisener()
  addTodoDeletedListener()
  addTodoStatusChanged()
  showTodoList()

  useClickInstall(document.getElementById('install-pwa'))
}

main()