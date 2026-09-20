import Swal from 'sweetalert2'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: {
    container: 'my-toast-container'
  }
})

export const alertSuccess = (message) => Toast.fire({ icon: 'success', title: message })
export const alertError = (message) => Toast.fire({ icon: 'error', title: message })
export const alertInfo = (message) => Toast.fire({ icon: 'info', title: message })





