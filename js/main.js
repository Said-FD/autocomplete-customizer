/* globals zlFetch */
// Results list is still visible on blur only for visual real time customizing
(() => {
  
const hideList = list => list.innerHTML = ''
const showList = (list, markup) => list.innerHTML = markup

const findMatches = (data, inputValue) => {
  const matches = data.filter(obj => obj[name].toLowerCase().startsWith(inputValue))
  const uniqMatches = (arr, key) => {
    let temp = {}
    let result = []

    // Using for loop as it have optimal performance up to 1000 iterations in this case
    for (let i = 0; i < arr.length; i++) {
      if (!temp[arr[i][key]]) {
        temp[arr[i][key]] = true
        result.push(arr[i])
      }
    }
    return result
  }
  return uniqMatches(matches, name)
}

const createInnerHTML = (matches, inputValue) => {
  return matches.map(obj => {
    let markup
    if (obj[image]) {
      markup = `
        <li class="has-image" data-prop="${obj[name]}">
          <img src="${obj[image]}" alt="Image of ${obj[name]}" />
          <span>${obj[name]}</span>
        </li>`
    } else {
      markup = `
        <li data-prop="${obj[name]}">
          <span>${obj[name]}</span>
        </li>`
    }
    return DOMPurify.sanitize(markup)
  }).join('')
}

const handleUserInput = (e, list, data) => {
  const input = e.target
  const inputValue = DOMPurify.sanitize(input.value.trim().toLowerCase())

  if (!inputValue) {
    hideList(list)
    return
  }
  
  const matches = findMatches(data, inputValue)
  const listItems = createInnerHTML(matches, inputValue)
  showList(list, listItems)
}

const handleListClick = (e, input, list) => {
  const listItem = e.target.closest('li')
  if (!listItem) return
  input.value = listItem.dataset.prop
  hideList(list)
}

const initAutocomplete = data => {
  const input = document.querySelector('.autocomplete-input')
  const list = document.querySelector('.autocomplete-list')
  input.value = ''
  input.focus()
  hideList(list)
  input.addEventListener('input', e => handleUserInput(e, list, data))
  list.addEventListener('click', e => handleListClick(e, input, list))
}

const sendRequest = endpoint => zlFetch(endpoint)
  .then(response => {
    const body = response.body
    body.hasOwnProperty('results')
      ? initAutocomplete(body.results)
      : body.hasOwnProperty('value')
        ? initAutocomplete(body.value)
        : initAutocomplete(body)

    // console.table(body)
  })
  .catch(error => console.log(error))

// Default endpoint and properties
// Rest countries API
let rootEndPoint = 'https://restcountries.eu/rest/v2/all?fields=name;flag'
let name = 'name'
let image = 'flag'

// Executes default search autocomplete
sendRequest(rootEndPoint)

// Custom autocomplete API
const formCaption = document.querySelector('.autocomplete-caption')
const apiForm = document.querySelector('.api-form-autocomplete')
const captionInput = apiForm.querySelector('.api-input-caption')

captionInput.addEventListener('input', e => {
  formCaption.textContent = DOMPurify.sanitize(e.target.value)
})

apiForm.addEventListener('submit', e => {
  e.preventDefault()

  const endpointInput = apiForm.querySelector('.api-input-endpoint')
  const nameInput = apiForm.querySelector('.api-prop-name')
  const imageInput = apiForm.querySelector('.api-prop-img')

  rootEndPoint = DOMPurify.sanitize(endpointInput.value.trim())
  name = DOMPurify.sanitize(nameInput.value.trim())
  image = DOMPurify.sanitize(imageInput.value.trim())

  sendRequest(rootEndPoint)
})

// Autocomplete user custom styling
const styleForm = document.querySelector('.api-form-style')
const resultsList = document.querySelector('.autocomplete-list')
const setCustomProp = (target, parent) => parent.style.setProperty(`--${target.className}`, target.value)

styleForm.addEventListener('input', e => {
  const target = e.target
  if (!target.closest('input')) return
  setCustomProp(target, resultsList)
})

// Autocomplete customizer description
const getContentHeight = example => {
  const content = example.querySelector('.api-example-inner')
  return !example.classList.contains('is-open')
    ? content.getBoundingClientRect().height
    : 0
}

const updateExample = (example, height) => {
  const content = example.querySelector('.api-example-content')
  example.classList.toggle('is-open')
  content.style.height = `${height}px`
}

const description = document.querySelector('.api-sources')

description.addEventListener('click', e => {
  const button = e.target.closest('.api-example-toggle')
  if (!button) return

  const example = button.parentElement
  const height = getContentHeight(example)
  updateExample(example, height)
})

// Autocomplete input interactions
const autocomplete = document.querySelector('.autocomplete')
const autocompleteInput = autocomplete.querySelector('.autocomplete-input')
const autocompleteResetBtn = autocomplete.querySelector('.autocomplete-reset-btn')

autocompleteInput.addEventListener('focus', e => {
  autocomplete.classList.add('is-active')
  e.target.removeAttribute('style')
})

autocompleteInput.addEventListener('blur', e => {
  e.target.style.borderColor = 'var(--grey-300)'
})

autocompleteResetBtn.addEventListener('click', e => {
  const target = e.target
  hideList(resultsList)
  autocompleteInput.focus()
  
  if (autocomplete.classList.contains('is-active')) {
    target.classList.add('animate')
    setTimeout(() => target.classList.remove('animate'), 350)
  }
})

window.addEventListener('click', e => {
  const notEmpty = autocompleteInput.value
  const notTarget = !e.target.closest('.autocomplete')

  if (!notEmpty && notTarget) autocomplete.classList.remove('is-active')
  if (notEmpty && notTarget) autocompleteInput.style.borderColor = 'var(--grey-300)'
})

// Autocomplete keyboard interactions
const getNextItem = (listItems, index) => {
  if (index !== listItems.length - 1) return listItems[index + 1]
}

const getPrevItem = (listItems, index) => {
  if (index !== 0) return listItems[index - 1]
}

const selectListItem = targetItem => {
  if (!targetItem) return
  targetItem.classList.add('is-selected')
  targetItem.setAttribute('tabindex', '1')
  targetItem.focus()
}

const clearSelectedItem = listItems => {
  listItems.forEach(item => {
    item.classList.remove('is-selected')
    item.removeAttribute('tabindex')
  })
}

const handleListKeyDown = (e, key) => {
  const listItems = [...resultsList.children]
  const index = listItems.findIndex(item => item.classList.contains('is-selected'))
  
  let targetItem
  if (key === 'ArrowDown') targetItem = getNextItem(listItems, index)
  if (key === 'ArrowUp') {
    targetItem = getPrevItem(listItems, index)

    if (!targetItem) {
      autocompleteInput.focus()
      setTimeout(() => autocompleteInput.selectionStart = autocompleteInput.selectionEnd = 1000, 0)
      clearSelectedItem(listItems)
    }
  }

  if (targetItem) {
    clearSelectedItem(listItems)
    selectListItem(targetItem)
  }

  if (key === 'Enter' || key === ' ') e.target.click()
  if (key === 'Escape') autocompleteResetBtn.click()
}

autocompleteInput.addEventListener('keydown', e => {
  const { key } = e
  if (key === 'ArrowDown') {
    e.preventDefault()
    selectListItem(resultsList.children[0])
  }
  if (key === 'Escape') autocompleteResetBtn.click()
})

resultsList.addEventListener('keydown', e => {
  const { key } = e
  if (!e.target.closest('li')) return
  e.preventDefault()
  handleListKeyDown(e, key)
})

})()
