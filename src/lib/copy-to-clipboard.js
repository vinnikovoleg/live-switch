/* eslint-disable */
const Clipboard = (window, document, navigator) => {
  let textArea
  let copy

  const isOS = () => navigator.userAgent.match(/ipad|iphone/i)

  const createTextArea = (text) => {
    textArea = document.createElement('textArea')
    textArea.value = text
    textArea.setAttribute('readonly', true)
    textArea.style.position = 'absolute'
    textArea.style.top = '-9999px'
    textArea.style.pointerEvents = 'none'
    document.body.appendChild(textArea)
  }

  const selectText = () => {
    let range
    let selection

    if (isOS()) {
      range = document.createRange()
      range.selectNodeContents(textArea)
      selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
      textArea.setSelectionRange(0, 999999)
    } else {
      textArea.select()
    }
  }

  const copyToClipboard = () => {
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  copy = function (text) {
    createTextArea(text)
    selectText()
    copyToClipboard()
  }

  return {
    copy
  }
}

export default Clipboard(window, document, navigator)
