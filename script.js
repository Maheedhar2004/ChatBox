const chatBody = document.querySelector(".chat-body");
const chatForm = document.querySelector(".chat-footer");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const voiceInputButton = document.querySelector("#voice-input");
const clearFileButton = document.querySelector("#clear-file");
const toggleTTSButton = document.querySelector("#toggle-tts");
const languageSelector = document.querySelector("#language-selector");
const clipContainer = document.querySelector(".clip-container");
const clipButton = document.querySelector("#clip-button");

const closeToolsMenu = () => {
  clipContainer.classList.remove("is-open");
  clipButton.setAttribute("aria-expanded", "false");
};

clipButton.addEventListener("click", () => {
  const isOpen = clipContainer.classList.toggle("is-open");
  clipButton.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (!clipContainer.contains(event.target)) closeToolsMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeToolsMenu();
});

const MODEL_NAME = "gemini-3.5-flash";
const API_URL = "/api/generate";

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
  language: "en", // Default language
};

// Supported languages and their codes
const languages = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  ja: "Japanese",
  zh: "Chinese",
};

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = userData.language;
}

// Initialize TTS
let ttsEnabled = false;

// Function to navigate to index1.html
const navigateToFaceDetection = () => {
  window.open("index1.html", "_blank");
};

// Helper function to create message elements in the chat
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const removeWelcomeMessage = () => document.querySelector(".welcome")?.remove();

// Function to convert text to speech
const speak = (text) => {
  if (ttsEnabled && 'speechSynthesis' in window) {
    const sentences = text.split(/[.!?]/g).filter(s => s.trim() !== "");
    const maxChunkLength = 1500000000; // Maximum characters per chunk
    const chunks = [];

    // Split sentences into chunks
    let currentChunk = "";
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxChunkLength) {
        currentChunk += sentence + ".";
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ".";
      }
    }
    if (currentChunk.trim() !== "") {
      chunks.push(currentChunk.trim());
    }

    // Function to speak a chunk
    const speakChunk = (index) => {
      if (index >= chunks.length) return; // Stop if all chunks are processed

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = userData.language; // Set TTS language
      utterance.rate = 1;
      utterance.pitch = 1;

      // Speak the next chunk when the current one ends
      utterance.onend = () => {
        speakChunk(index + 1);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Start speaking the first chunk
    speakChunk(0);
  } else {
    console.error("Text-to-speech not supported in this browser.");
  }
};

// Function to generate the bot response using the Gemini API
const generateBotResponse = async (incomingMessageDiv, attachment = userData.file) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Predefined responses
  const predefinedResponses = {
    hi: {
      en: "hi",
      es: "hola",
      fr: "salut",
      de: "hallo",
      hi: "नमस्ते",
      ja: "こんにちは",
      zh: "你好",
    },
    hello: {
      en: "hello",
      es: "hola",
      fr: "bonjour",
      de: "hallo",
      hi: "नमस्ते",
      ja: "こんにちは",
      zh: "你好",
    },
    whoAreYou: {
      en: "I was invented by Team Mac.Team members -Maheedhar, Thoufiq, Lahari, Revathi, Sukanya",
      es: "Un chatbot creado por Mahi",
      fr: "Un chatbot créé par Mahi",
      de: "Ein Chatbot, erstellt von Mahi",
      hi: "मही द्वारा बनाया गया एक चैटबॉट",
      ja: "マヒによって作成されたチャットボット",
      zh: "由Mahi创建的聊天机器人",
    },
    mahi: {
      en: "The man who created me",
      es: "El hombre que me creó",
      fr: "L'homme qui m'a créé",
      de: "Der Mann, der mich erschaffen hat",
      hi: "वह व्यक्ति जिसने मुझे बनाया",
      ja: "私を作った人",
      zh: "创造我的人",
    },
    playVideo: {
      en: "Opening YouTube...",
      es: "Abriendo YouTube...",
      fr: "Ouverture de YouTube...",
      de: "Öffne YouTube...",
      hi: "YouTube खोल रहा है...",
      ja: "YouTubeを開いています...",
      zh: "正在打开YouTube...",
    },
    openGoogle: {
      en: "Opening Google...",
      es: "Abriendo Google...",
      fr: "Ouverture de Google...",
      de: "Öffne Google...",
      hi: "Google खोल रहा है...",
      ja: "Googleを開いています...",
      zh: "正在打开Google...",
    },
    openMaps: {
      en: "Opening Google Maps...",
    },
  
  };

  // Check if the user's message is "hi"
  if (userData.message.toLowerCase().trim() === "hi") {
    const response = predefinedResponses.hi[userData.language] || predefinedResponses.hi.en;
    messageElement.innerText = response;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMessageButton.disabled = false;
    speak(response);
    return;
  }

  // Check if the user's message is "hello"
  if (userData.message.toLowerCase().trim() === "hello") {
    const response = predefinedResponses.hello[userData.language] || predefinedResponses.hello.en;
    messageElement.innerText = response;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMessageButton.disabled = false;
    speak(response);
    return;
  }

  // Check if the user's message is "mahi"
  if (userData.message.toLowerCase().trim() === "mahi") {
    const response = predefinedResponses.mahi[userData.language] || predefinedResponses.mahi.en;
    messageElement.innerText = response;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMessageButton.disabled = false;
    speak(response);
    return;
  }

  // Check if the user's message is "play video"
if (userData.message.toLowerCase().trim() === "play video" ||
    userData.message.toLowerCase().trim() === "open youtube") {
  const response = predefinedResponses.playVideo[userData.language] || predefinedResponses.playVideo.en;
  messageElement.innerText = response;
  incomingMessageDiv.classList.remove("thinking");
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  sendMessageButton.disabled = false;
  speak(response);

  // Open YouTube in a new tab
  window.open("https://www.youtube.com", "_blank");
  return;
}
// Check if the user's message is "openGoogle maps"
if (userData.message.toLowerCase().trim() === "open maps") {
  const response = predefinedResponses.openMaps[userData.language] || predefinedResponses.openMaps.en;
  messageElement.innerText = response;
  incomingMessageDiv.classList.remove("thinking");
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  sendMessageButton.disabled = false;
  speak(response);

  // Open YouTube in a new tab
  window.open("https://maps.google.com/maps", "_blank");
  return;
}

if (userData.message.toLowerCase().trim() === "open google") {
  const response = predefinedResponses.openGoogle[userData.language] || predefinedResponses.openGoogle.en;
  messageElement.innerText = response;
  incomingMessageDiv.classList.remove("thinking");
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  sendMessageButton.disabled = false;
  speak(response);

  // Open YouTube in a new tab
  window.open("https://www.google.co.in/", "_blank");
  return;
}

  // Check if the user's message is "who are you?" or similar
  if (
    userData.message.toLowerCase().trim() === "who are you?" || 
    userData.message.toLowerCase().trim() === "who r u?" ||
    userData.message.toLowerCase().trim() === "who r u" ||
    userData.message.toLowerCase().trim() === "who are u" ||
    userData.message.toLowerCase().trim() === "who are u?" ||
    userData.message.toLowerCase().trim() === "who are you" ||
    userData.message.toLowerCase().trim() === "what are you" ||
    userData.message.toLowerCase().trim() === "who invented u"||
    userData.message.toLowerCase().trim() === "who invented you"
  ) {
    const response = predefinedResponses.whoAreYou[userData.language] || predefinedResponses.whoAreYou.en;
    messageElement.innerText = response;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMessageButton.disabled = false;
    speak(response);
    return;
  }

  // If no predefined response, proceed with API call
  const userMessage = userData.language === "en"
    ? userData.message
    : `Reply only in ${languages[userData.language] || "English"}.\n\nUser message: ${userData.message}`;

  // Prepare the body for the API request
  const requestBody = {
    contents: [
      {
        parts: [
          { text: userMessage || "Describe this image." },
          ...(attachment.data
            ? [{ inline_data: { data: attachment.data, mime_type: attachment.mime_type } }]
            : []),
        ],
      },
    ],
  };

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  };

  try {
    // Capacity errors are usually brief. Retry them twice before asking the
    // user to try again, but do not retry invalid requests or authentication
    // failures.
    const maxAttempts = 3;
    let response;
    let data;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      response = await fetch(API_URL, requestOptions);
      data = await response.json().catch(() => ({}));

      if (response.ok) break;

      const transientStatus = [429, 500, 502, 503, 504].includes(response.status);
      if (!transientStatus || attempt === maxAttempts) {
        if ([404, 405].includes(response.status)) {
          throw new Error(
            "The assistant server was not found. Start the app with `node server.js` and open http://localhost:3000."
          );
        }
        throw new Error(
          data.error?.message || `The assistant service returned HTTP ${response.status}.`
        );
      }

      const delayMs = 1000 * 2 ** (attempt - 1);
      messageElement.innerText = `The assistant is busy. Retrying (${attempt}/${maxAttempts - 1})...`;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Gemini responses can include non-text parts (for example, reasoning)
    // before the visible answer. Pick the first visible text part instead of
    // assuming it is always the first part in the first candidate.
    const responseParts = data.candidates?.flatMap((candidate) => candidate.content?.parts || []) || [];
    const responseText = responseParts.find(
      (part) => typeof part.text === "string" && !part.thought
    )?.text;
    const apiResponseText = responseText?.replace(/\*\*(.*?)\*\*/g, "$1").trim();

    if (!apiResponseText) {
      const blockReason = data.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `The request was blocked by Gemini (${blockReason}).`
          : "The assistant returned no visible text. Please try again."
      );
    }

    messageElement.innerText = apiResponseText;
    speak(apiResponseText); // Speak the bot's response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Gemini request failed:", errorMessage);
    messageElement.innerText = `I couldn't complete that request. ${errorMessage}`;
    messageElement.style.color = "#b42318";
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMessageButton.disabled = false;
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  if (sendMessageButton.disabled) return;

  userData.message = messageInput.value.trim();
  messageInput.value = "";

  if (!userData.message && !userData.file.data) return;
  const messageAttachment = { ...userData.file };

  // Check if the message is "arise"
  if (userData.message.toLowerCase() === "arise") {
    navigateToFaceDetection(); // Navigate to index1.html
    return; // Stop further processing
  }

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${
                            messageAttachment.data
                              ? `<img src="data:${messageAttachment.mime_type};base64,${messageAttachment.data}" class="attachment" />`
                              : ""
                          }`;
  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").textContent = userData.message || "Uploaded file";
  removeWelcomeMessage();
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  sendMessageButton.disabled = true;

  // The attachment is now part of the sent message, so clear the composer preview.
  userData.file = { data: null, mime_type: null };
  fileInput.value = "";
  clearFileButton.classList.add("hidden");
  document.querySelectorAll(".file-preview, .file-name").forEach((element) => element.remove());

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `
      <div class="bot-avatar"></div>
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv, messageAttachment);
  }, 600);
};

// Let the form handle both Enter and the Send button, including image-only messages.
chatForm.addEventListener("submit", handleOutgoingMessage);

// Handle file input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    fileInput.value = "";
    return;
  }

  if (file.size > 7 * 1024 * 1024) {
    alert("Please choose an image smaller than 7 MB.");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64String = e.target.result.split(",")[1];

    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };

    document.querySelectorAll(".file-preview, .file-name").forEach((element) => element.remove());
    const preview = document.createElement("img");
    preview.src = e.target.result;
    preview.alt = `Selected image: ${file.name}`;
    preview.className = "file-preview";
    messageInput.insertAdjacentElement("beforebegin", preview);

    fileInput.value = ""; // Clear the input
    clearFileButton.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

// Handle clear file button click
clearFileButton.addEventListener("click", () => {
  userData.file = { data: null, mime_type: null }; // Clear file data
  fileInput.value = ""; // Clear the input
  clearFileButton.classList.add("hidden");
  document.querySelectorAll(".file-preview, .file-name").forEach((element) => element.remove());
  closeToolsMenu();
});

// Handle file upload button click
document.querySelector("#file-upload").addEventListener("click", () => {
  closeToolsMenu();
  fileInput.click();
});

// Handle voice input button click
voiceInputButton.addEventListener("click", () => {
  closeToolsMenu();
  if (!recognition) {
    alert("Voice input is not supported by this browser. Try Chrome or Edge.");
    return;
  }
  if (voiceInputButton.classList.contains("recording")) {
    recognition.stop(); // Stop recording if already active
    voiceInputButton.classList.remove("recording");
  } else {
    recognition.start(); // Start recording
    voiceInputButton.classList.add("recording");
  }
});

// Handle speech recognition result
recognition?.addEventListener("result", (e) => {
  const transcript = e.results[0][0].transcript.trim().toLowerCase();
  messageInput.value = transcript;
  voiceInputButton.classList.remove("recording");
  chatForm.requestSubmit();
});


// Handle speech recognition end
recognition?.addEventListener("end", () => {
  voiceInputButton.classList.remove("recording");
});

// Handle speech recognition error
recognition?.addEventListener("error", (e) => {
  console.error("Speech recognition error:", e.error);
  voiceInputButton.classList.remove("recording");
  alert("Speech recognition failed. Please ensure your microphone is enabled and try again.");
});

// Toggle TTS
toggleTTSButton.addEventListener("click", () => {
  ttsEnabled = !ttsEnabled;
  toggleTTSButton.querySelector(".tool-name").textContent = "Voice replies";
  toggleTTSButton.querySelector(".tool-hint").textContent = ttsEnabled
    ? "Disable spoken assistant replies"
    : "Enable spoken assistant replies";
  closeToolsMenu();
});

// Handle language selection
languageSelector.addEventListener("change", (e) => {
  userData.language = e.target.value;
  if (recognition) recognition.lang = userData.language;
  localStorage.setItem("chatbotLanguage", userData.language); // Save language preference
  closeToolsMenu();
});

// Load saved language preference
const savedLanguage = localStorage.getItem("chatbotLanguage");
if (savedLanguage) {
  userData.language = savedLanguage;
  languageSelector.value = savedLanguage;
  if (recognition) recognition.lang = savedLanguage;
}

// Handle camera button click
document.getElementById("camera-button").addEventListener("click", () => {
  closeToolsMenu();
  navigateToFaceDetection(); // Navigate to index1.html
});

///
