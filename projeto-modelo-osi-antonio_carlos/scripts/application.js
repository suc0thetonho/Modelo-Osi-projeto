const USER_NAME = 'suquin.toe'

const user = document.querySelector('.user')
user.textContent = `Usuário: ${USER_NAME}`

const reqBtn = document.querySelector('.request-btn')
reqBtn.addEventListener('click', function (event) {
  event.preventDefault()
  const protocolName = document.querySelector('.protocol-name')
  const reqText = document.querySelector('.text-input')
  const requestText = reqText.value
  const currentTimestamp = new Date().toISOString()

  if (requestText.includes('@')) {
    protocolName.textContent = 'SMTP/POP'

    const email = {
      remetente: USER_NAME,
      destinatario: requestText,
      assunto: '',
      corpo: '',
      protocolo: 'SMTP',
      timestamp: currentTimestamp
    };
    console.log(email);

  } else if (requestText.includes('www')) {
    protocolName.textContent = 'HTTP/HTTPS'

    const requisicaoSite = {
      tipo: "http_request",
      metodo: "GET",
      hostIP: '',
      protocolo: '',
      usuario: USER_NAME,
      timestamp: currentTimestamp
    };
    console.log(requisicaoSite);

  } else {
    protocolName.textContent = 'WEBSOCKET'

    const chat = {
      tipo: 'chat',
      usuario: USER_NAME,
      mensagem: requestText,
      protocolo: '',
      timestamp: currentTimestamp
    };
    console.log(chat);
  }

  reqText.value = ''
})

const inputFile = document.querySelector('#arquivo')
inputFile.addEventListener('change', () => {
  if (inputFile.files.length > 0) {
    const file = inputFile.files[0]
    alert(file.name)

    const arquivo = {
      nomeArquivo: file.name,
      formato: '',
      remetente: '',
      protocolo: '',
      timestamp: new Date().toISOString()
    };
    console.log(arquivo);
  }
})

inputFile.addEventListener('cancel', () => {
  alert('Cancelado')
})