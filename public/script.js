var selectedWords = new Set();

/**
 * STATE MANAGER
 */
const states = {
    IDLE: 'IDLE',
    WAITING: 'WAITING',
    DISPLAYING: 'DISPLAYING'
};
function createStateManager() {
    let currentState; 
    return {
        getCurrentState() {
            return currentState;
        },
        setState(newState) {
            if(currentState)
                document.body.classList.remove(currentState.toLowerCase());
            document.body.classList.add(newState.toLowerCase());

            if (Object.values(states).includes(newState)) {
                currentState = newState;
            } else {
                console.error(`Estado inválido: ${newState}`);
            }
        },
        getAvailableStates() {
            return Object.values(states);
        }
    };
}
const stateManager = createStateManager();
stateManager.setState(states.IDLE);

/**
 * SOCKET
 */
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const socketUrl = `${protocol}//${host}`;

let socket;
const startWebSocket = () => {
    return new Promise((resolve, reject) => {
        socket = new WebSocket(socketUrl);
        
        socket.onopen = () => {
            console.log("Conexão WebSocket estabelecida.");
            appendMessage("Conexão estabelecida.");
            resolve();
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Mensagem recebida: ", data.text);
            appendMessage(`Audio URL: ${data.audioURL}`);
            appendMessage(`Pergunta: ${data.text}`);
            displayWord(
                data.text,
                data.audioURL
            );
            stateManager.setState(states.DISPLAYING);
        };
        
        socket.onerror = (error) => {
            console.error("Erro no WebSocket: ", error);
            appendMessage("Erro na conexão.");
            reject();
        };
        
        socket.onclose = () => {
            console.log("Conexão WebSocket fechada.");
            appendMessage("Conexão encerrada.");
        };
    });
}

function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
        appendMessage(`Você: ${message}`);
    } else {
        appendMessage("A conexão não está aberta.");
    }
}

function sendWords() {
    if(selectedWords.size > 0) {
        loading.start(() => {
            sendMessage(Array.from(selectedWords).join(","));
            stateManager.setState(states.WAITING);
        });
    }else{
        loading.cancel();
    }
}

function appendMessage(message) {
    const messagesList = document.getElementById("messages");
    const listItem = document.createElement("li");
    listItem.textContent = message;
    messagesList.appendChild(listItem);
}

/**
 * SHOW MESSAGE
 */
function displayWord(text, audioUrl) {
    const textElement = document.createElement("div");
    textElement.className = "phrase";
    textElement.textContent = text;
    document.body.appendChild(textElement);

    const audio = new Audio(audioUrl);
    audio.play();

    audio.addEventListener("ended", () => {
        document.body.removeChild(textElement);
        stateManager.setState(states.IDLE);
    });
}

/**
 * DIV MANAGAGER
 */
const container = document.getElementById("container");
const dragAreaSize = 150;
const draggableSize = 100;

function createDropAreas(count) {
  for (let i = 0; i < count; i++) {
    const x = Math.sin(i / count * Math.PI * 2) * 200 + 410 - dragAreaSize / 2;
    const y = Math.cos(i / count * Math.PI * 2) * 200 + 410 - dragAreaSize / 2;
    const dropArea = document.createElement("div");
    dropArea.classList.add("drop-area");
    dropArea.style.left = `${x}px`;
    dropArea.style.top = `${y}px`;
    dropArea.setAttribute("data-occupied", "false");
    container.appendChild(dropArea);
  }
}

function createDraggables(words) {
  for (let i = 0; i < words.length; i++) {
    const x = Math.sin(i / words.length * Math.PI * 2) * 350 + 410 - draggableSize / 2;
    const y = Math.cos(i / words.length * Math.PI * 2) * 350 + 410 - draggableSize / 2;
    const word = words[i].palavra;
    const draggable = document.createElement("div");
    draggable.textContent = word;
    draggable.classList.add("draggable");
    draggable.style.left = `${x}px`;
    draggable.style.top = `${y}px`;
    draggable.setAttribute("data-original-x", x);
    draggable.setAttribute("data-original-y", y);
    draggable.setAttribute("data-word", word);
    container.appendChild(draggable);
    makeDraggable(draggable);
  }
}

function makeDraggable(dragItem) {
    dragItem.addEventListener('mousedown', startDrag);
    dragItem.addEventListener('touchstart', startDrag);
  
    function startDrag(e) {
      if (stateManager.getCurrentState() !== states.IDLE)
        return;
  
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      const startX = clientX - dragItem.offsetLeft;
      const startY = clientY - dragItem.offsetTop;
  
      dragItem.classList.add("dragging");
  
      function moveDrag(e) {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        dragItem.style.left = `${clientX - startX}px`;
        dragItem.style.top = `${clientY - startY}px`;
      }
  
      function stopDrag() {
        dragItem.classList.remove("dragging");
  
        let snapped = false;
        const dropAreas = document.querySelectorAll('.drop-area');
        dropAreas.forEach((area, areaIndex) => {
          const areaRect = area.getBoundingClientRect();
          const dragRect = dragItem.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(areaRect.left + areaRect.width / 2 - (dragRect.left + dragRect.width / 2), 2) +
            Math.pow(areaRect.top + areaRect.height / 2 - (dragRect.top + dragRect.height / 2), 2)
          );
  
          if (distance < 100 && area.getAttribute("data-occupied") === "false") {
            dragItem.style.left = `${areaRect.left - container.getBoundingClientRect().left + dragAreaSize / 2 - draggableSize / 2}px`;
            dragItem.style.top = `${areaRect.top - container.getBoundingClientRect().top + dragAreaSize / 2 - draggableSize / 2}px`;
            area.setAttribute("data-occupied", "true");
            dragItem.setAttribute("data-occupied-area", areaIndex);
            selectedWords.add(dragItem.getAttribute("data-word"));
            words[words.findIndex(word => word.palavra === dragItem.getAttribute("data-word"))].audio.play();
            sendWords();
            snapped = true;
          }
        });
  
        if (!snapped) {
          selectedWords.delete(dragItem.getAttribute("data-word"));
          sendWords();
  
          const originalX = parseInt(dragItem.getAttribute("data-original-x"));
          const originalY = parseInt(dragItem.getAttribute("data-original-y"));
          dragItem.style.left = `${originalX}px`;
          dragItem.style.top = `${originalY}px`;
  
          if (dragItem.hasAttribute("data-occupied-area")) {
            const areaIndex = dragItem.getAttribute("data-occupied-area");
            dropAreas[areaIndex].setAttribute("data-occupied", "false");
            dragItem.removeAttribute("data-occupied-area");
          }
        }
  
        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('touchend', stopDrag);
      }
  
      document.addEventListener('mousemove', moveDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', moveDrag);
      document.addEventListener('touchend', stopDrag);
    }
  }

/**
 * AUDIO
 */
let audioContextUnlocked = false;
document.addEventListener('touchend', function() {
  if (!audioContextUnlocked) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    context.resume().then(() => {
      audioContextUnlocked = true;
    });
  }
}, { once: true });
  

/**
 * LOADING
 */
function createLoading(duration) {
    let progress = 0;
    let progressStart = 0;
    let onCompleteCallback;
    
    const loadingElement = document.createElement("div");
    loadingElement.className = "loading";
    const arc = document.createElement("div");
    arc.className = "arc";
    arc.id = "arc";
    loadingElement.appendChild(arc);

    function updateProgress(timestamp) {
        if (progressStart == 0) {
            progressStart = timestamp;
        }
        
        const elapsed = timestamp - progressStart;
        progress = Math.min(elapsed, duration);

        const percentage = (progress / duration) * 100;
    
        const degrees = (percentage / 100) * 360;
        arc.style.setProperty("--progress", `${degrees}deg`);
    
        if (progress >= duration) {
            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
            if (onCompleteCallback) onCompleteCallback();
        } else if (document.body.contains(loadingElement)) {
            requestAnimationFrame(updateProgress);
        }
    }
    
    return {
        cancel() {
            if (document.body.contains(loadingElement))
                document.body.removeChild(loadingElement);
        },
        start(onComplete) {
            onCompleteCallback = onComplete;

            progress = 0;
            progressStart = 0;
            
            if (!document.body.contains(loadingElement)) {
                document.body.appendChild(loadingElement);
                requestAnimationFrame(updateProgress);
            }
        }
    };
}
const loading = createLoading(3000);

/**
 * LOAD DATA
 */
let words;

const loadWords = () =>
    new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('palavras.json'); 
            words = await response.json();
            words.forEach((item, index) => {
                //  console.log(`Código RFID: ${item.codigo}, Palavra: ${item.palavra}`);
                words[index].audio = new Audio(item.audioUrl);
                words[index].audio.preload = 'auto';
            });
            
            resolve();
        } catch (error) {
            console.error('Erro ao carregar o arquivo JSON:', error);
            reject();
        }
    });

function init() {
    createDropAreas(3);
    createDraggables(words);
}

// Previne o recarregamento da página ao arrastar o dedo na tela
document.addEventListener('touchmove', function (event) {
    event.preventDefault();
}, { passive: false });

Promise.all([loadWords(), startWebSocket()]).then(init);