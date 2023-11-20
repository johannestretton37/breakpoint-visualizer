const body = document.body;
const tailwindRegex = /^\.([a-z]*)\\\:/i;

const parseStylesheets = () => {
  const mediaQueries = [{ name: 'default', minWidth: 0 }];
  const styleSheets = document.styleSheets;
  for (const styleSheet of styleSheets) {
    const rules = styleSheet.cssRules;
    for (const rule of rules) {
      if (rule.media) {
        if (rule.conditionText.includes('min-width')) {
          for (const cssRule of rule.cssRules) {
            const breakpoint = cssRule.selectorText?.match(tailwindRegex);
            if (
              breakpoint &&
              !mediaQueries.find((q) => q.name === breakpoint[1])
            ) {
              mediaQueries.push({
                name: breakpoint[1],
                minWidth: Number(
                  rule.conditionText.match(/min\-width\: ([\d]*)px/)[1]
                ),
              });
              break;
            }
          }
        }
      }
    }
  }

  mediaQueries.sort((a, b) => (a.minWidth > b.minWidth ? 1 : -1));
  return mediaQueries;
};

const renderToolbar = () => {
  console.log(
    '✨ Found css breakpoints ✨\n' +
      mediaQueries
        .filter(({ minWidth }) => minWidth > 0)
        .map(
          ({ name, minWidth }) => `   ${name}\t👉\t(min-width: ${minWidth}px)`
        )
        .join('\n')
  );
  const toolbar = document.createElement('div');
  toolbar.id = 'breakpoint-visualizer-toolbar';
  toolbar.className = 'toolbar visible';
  body.appendChild(toolbar);

  const lines = document.createElement('div');
  lines.className = 'lines';
  toolbar.appendChild(lines);

  const mediaStyles = document.createElement('style');
  document.head.appendChild(mediaStyles);

  mediaQueries.forEach(({ name, minWidth }, i) => {
    const line = document.createElement('div');
    line.className = `line ${name}`;
    line.style.width = `${minWidth}px`;
    line.style.backgroundColor = `hsl(${Math.round(
      360 * (i / mediaQueries.length)
    )} 50% 50%)`;
    lines.appendChild(line);

    const text = document.createElement('span');
    text.className = `text ${name}`;
    text.innerText = `${name} (min-width: ${minWidth}px)`;
    line.appendChild(text);

    const nextWidth = mediaQueries[i + 1]?.minWidth;
    const mediaRule =
      document.createTextNode(`@media screen and (min-width: ${minWidth}px)${
        nextWidth !== undefined ? ` and (max-width: ${nextWidth - 1}px)` : ''
      } {
      .toolbar .line.${name} {
        height: 100%;
      }
      .toolbar .text.${name} {
        display: block;
        transform: none;
        opacity: 1;
      }
    }`);
    mediaStyles.appendChild(mediaRule);
  });
};

let mediaQueries = parseStylesheets();

if (mediaQueries.length > 1) {
  renderToolbar();
} else {
  console.log('💥 Found no css breakpoints, retrying in 3s 💥');
  console.log(document.styleSheets);
  setTimeout(() => {
    mediaQueries = parseStylesheets();
    if (mediaQueries.length > 1) {
      renderToolbar();
    } else {
      console.log('💥 Giving up... 💥');
      const toolbar = document.createElement('div');
      toolbar.id = 'breakpoint-visualizer-toolbar';
      toolbar.classList.add('error');
      const errorElement = document.createElement('p');
      errorElement.innerHTML =
        '<b>Error:</b> Could not find any tailwindcss breakpoints.';
      toolbar.appendChild(errorElement);
      body.appendChild(toolbar);
    }
  }, 3000);
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === 'checkOverlayStatus') {
    const toolbar = document.getElementById('breakpoint-visualizer-toolbar');
    sendResponse({
      toolbarStatus: {
        isCreated: toolbar !== null,
        isVisible: toolbar ? toolbar.classList.contains('visible') : false,
        hasError: toolbar ? toolbar.classList.contains('error') : false,
      },
    });
  }
});
