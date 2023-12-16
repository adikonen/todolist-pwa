export default class Modal {

  titleText
  /**
   * 
   * @param {boolean} ableOutsideClick 
   */
  constructor(ableOutsideClick = true) {
    this.modalWrapperEl = document.getElementById('modal-wrapper')
    this.modalEl = document.getElementById('modal')
    this.modalTitle = this.modalEl.querySelector('#modal-title')
    this.modalBody = this.modalEl.querySelector('#modal-body')
    this.ableOutsideClick = ableOutsideClick

    this.listenCloseEvent()
    if (ableOutsideClick) {
      this.listenOutsideClick()
    }
  }

  showModal() {
    this.modalWrapperEl.classList.remove('d-none')
    this.modalEl.classList.add('modal--show')
  }
  
  setTitle(titleText) {
    this.titleText = titleText
    this.modalTitle.innerText = titleText
  }
  
  setBody(node) {
    if (node == undefined) {
      this.hideModal()
    }
    this.modalBody.innerHTML = ''
    node instanceof Array 
      ? this.modalBody.append(...node)
      : this.modalBody.appendChild(node)
  }

  hideModal() {
    this.modalEl.classList.remove('modal--show')
    this.modalEl.classList.add('modal--hide')
    
    setTimeout(() => {
      this.modalEl.classList.remove('modal--hide')
      this.modalWrapperEl.classList.add('d-none')
    }, 500);
  }

  listenCloseEvent() {
    document.addEventListener('modal.close', (e) => {
      this.hideModal()
    })
  }

  listenOutsideClick() {
    document.addEventListener('click', (e) => {
      if (e.target == this.modalWrapperEl || e.target === this.modalEl.parentElement) {
        this.hideModal()
      }
    })
  }

}
