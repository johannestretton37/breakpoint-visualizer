let isCreated = false;
let isVisible = false;

const addOverlayBtn = document.getElementById('addOverlay');
addOverlayBtn.innerText = 'loading...';
addOverlayBtn.disabled = true;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  if (activeTab) {
    try {
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: 'checkOverlayStatus' },
        (response) => {
          console.log('response', response);
          if (response === undefined) {
            isCreated = false;
            setup();
            return;
          }
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          const { toolbarStatus } = response;
          isCreated = toolbarStatus.isCreated;
          isVisible = toolbarStatus.isVisible;
          setup();
        }
      );
    } catch {
      isCreated = false;
      isVisible = false;
      setup();
    }
  }
});

function setup() {
  addOverlayBtn.innerText = isVisible ? 'Hide overlay' : 'Show overlay';
  addOverlayBtn.disabled = false;

  addOverlayBtn.addEventListener('click', (e) => {
    addOverlayBtn.disabled = true;
    addOverlayBtn.innerText = 'Please wait...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        if (isCreated) {
          isVisible = !isVisible;
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id, allFrames: false },
            func: toggleToolbar,
          });
          addOverlayBtn.innerText = isVisible ? 'Hide overlay' : 'Show overlay';
          addOverlayBtn.disabled = false;
        } else {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id, allFrames: false },
            files: ['src/index.js'],
          });
          chrome.scripting.insertCSS({
            target: { tabId: activeTab.id, allFrames: false },
            files: ['src/index.css'],
          });
          addOverlayBtn.innerText = 'Hide overlay';
          addOverlayBtn.disabled = false;
          isCreated = true;
          isVisible = true;
        }
      }
    });
  });
}

const toggleToolbar = () => {
  const toolbar = document.getElementById('breakpoint-visualizer-toolbar');
  if (toolbar) {
    toolbar.classList.toggle('visible');
  }
};
