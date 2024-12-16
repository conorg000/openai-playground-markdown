import { marked } from 'marked';
const target_div = ".GCWeG";
const DEBOUNCE_DELAY = 700; // Adjust the delay as needed based on content streaming behavior

// Array to keep track of processed elements
const processedElements = [];

// **Global toggle state**
let isParsingToggledOff = false; // false indicates parsing is toggled on (parsed markdown is shown)

// Function to convert Markdown and apply it to the parsedDiv
function updateParsedMarkdown(element) {
    let markdownContent = element.innerText || element.textContent;

    // Remove ```markdown code fences at the start and end if present
    if (markdownContent.startsWith('```markdown')) {
        markdownContent = markdownContent.replace(/^```markdown\s*\n?/, '');
        markdownContent = markdownContent.replace(/\n?```$/, '');
    }

    const htmlContent = marked(markdownContent);

    // Update the parsedDiv's content
    if (element.__parsedDiv) {
        element.__parsedDiv.innerHTML = htmlContent;

        // Adjust pre elements inside parsedDiv
        const preElements = element.__parsedDiv.querySelectorAll('pre');
        preElements.forEach(pre => {
            pre.style.fontSize = '0.8rem';
        });

        // Adjust code elements inside parsedDiv
        const codeElements = element.__parsedDiv.querySelectorAll('code');
        codeElements.forEach(codeElem => {
            codeElem.style.width = '-webkit-fill-available';
        });
    }
}

// Function to handle edits to the original element
function monitorOriginalElementForChanges(element) {
    // If an observer already exists, disconnect it
    if (element.__editObserver) {
        element.__editObserver.disconnect();
    }

    // Create a MutationObserver to detect changes in the element's text content
    const observer = new MutationObserver(mutationsList => {
        // Use a debounce mechanism to avoid rapid reprocessing
        clearTimeout(element.__editDebounceTimer);
        element.__editDebounceTimer = setTimeout(() => {
            console.log('Detected changes in original element. Updating parsed markdown.');
            updateParsedMarkdown(element);
        }, 300); // Adjust debounce delay as needed
    });

    // Start observing the element for character data changes
    observer.observe(element, {
        characterData: true,
        subtree: true,
        childList: true,
    });

    // Store the observer on the element for later disconnection
    element.__editObserver = observer;
}

// Function to convert Markdown and apply it to the element
function convertMarkdownToHTML(element) {
    // Check if we've already processed this element
    if (element.__processed) {
        return;
    }
    element.__processed = true;

    // Store the original element (reference)
    if (!element.__originalElement) {
        element.__originalElement = element; // Reference to the original element
    }

    let markdownContent = element.innerText || element.textContent;

    // Remove ```markdown code fences at the start and end if present
    if (markdownContent.startsWith('```markdown')) {
        markdownContent = markdownContent.replace(/^```markdown\s*\n?/, '');
        markdownContent = markdownContent.replace(/\n?```$/, '');
    }

    const htmlContent = marked(markdownContent);

    // Create a new div to hold the parsed content
    const parsedDiv = document.createElement('div');
    parsedDiv.className = 'parsed-markdown';
    parsedDiv.innerHTML = htmlContent;

    // Adjust pre elements inside parsedDiv
    const preElements = parsedDiv.querySelectorAll('pre');
    preElements.forEach(pre => {
        pre.style.fontSize = '0.8rem';
    });

    // Adjust code elements inside parsedDiv
    const codeElements = parsedDiv.querySelectorAll('code');
    codeElements.forEach(codeElem => {
        codeElem.style.width = '-webkit-fill-available';
    });

    // **Set initial visibility based on the global toggle state**
    if (isParsingToggledOff) {
        // Parsing is toggled off globally; show original, hide parsed markdown
        element.style.display = '';
        parsedDiv.style.display = 'none';

        // Start monitoring for changes
        monitorOriginalElementForChanges(element);
    } else {
        // Parsing is toggled on globally; show parsed markdown, hide original
        element.style.display = 'none';
        parsedDiv.style.display = '';
    }

    // Insert parsedDiv into the DOM after the original element
    element.parentNode.insertBefore(parsedDiv, element.nextSibling);

    // Store the parsedDiv in element.__parsedDiv
    element.__parsedDiv = parsedDiv;

    // Keep track of the element
    if (!processedElements.includes(element)) {
        processedElements.push(element);
    }

    // Initialize the toggle state based on the global state
    element.__isMarkdownToggled = isParsingToggledOff; // true if parsing is toggled off
}

// Function to monitor a target div until its streaming content is fully loaded
function monitorStreamingContent(element) {
    let debounceTimer;

    // Callback function for the MutationObserver monitoring the element's content
    const contentObserverCallback = (mutationsList, observer) => {
        // Whenever a mutation occurs, reset the debounce timer
        clearTimeout(debounceTimer);

        // Set a new debounce timer
        debounceTimer = setTimeout(() => {
            // Content has stopped changing for DEBOUNCE_DELAY milliseconds
            // We can now process the markdown
            observer.disconnect(); // Stop observing the element's content
            console.log('Content fully loaded, processing markdown for:', element);

            // Convert the markdown content to HTML
            convertMarkdownToHTML(element);
        }, DEBOUNCE_DELAY);
    };

    // Create a MutationObserver to monitor content changes within the element
    const contentObserver = new MutationObserver(contentObserverCallback);

    // Start observing the element for character data changes and child node additions/removals
    contentObserver.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
    });
}

function hasAssistantSibling(element) {
    const parent = element.parentElement;
    if (parent) {
        const siblings = Array.from(parent.children);
        for (const sibling of siblings) {
            if (
                sibling !== element &&
                sibling.classList.contains('v9phc') &&
                sibling.textContent.trim() === 'assistant'
            ) {
                return true;
            }
        }
    }
    return false;
}

// Handle new target divs by setting up a content monitor for each
function handleNewTargetDivs(elements) {
    elements.forEach(element => {
        if (!element.__monitoringStarted) { // Avoid setting up multiple observers for the same element
            // Check if the element meets the new condition
            if (hasAssistantSibling(element)) {
                element.__monitoringStarted = true;
                console.log('Found a new target div with matching sibling. Starting to monitor content:', element);

                // Start monitoring the element's content until it's fully loaded
                monitorStreamingContent(element);
            } else {
                console.log('Div does not have the required sibling, skipping:', element);
            }
        }
    });
}

// Set up the main observer to detect new target divs added to the DOM
function setupMainObserver() {
    const mainObserver = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // Only process element nodes
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        let targetElements = [];

                        // Check if the node itself matches the target selector
                        if (node.matches && node.matches(target_div)) {
                            targetElements.push(node);
                        }

                        // Check for any descendants that match the target selector
                        targetElements = targetElements.concat(Array.from(node.querySelectorAll(target_div)));

                        // Handle the new target divs
                        handleNewTargetDivs(targetElements);
                    }
                });
            }
        });
    });

    // Observe the body for added nodes in the subtree
    const body = document.body;
    if (body) {
        mainObserver.observe(body, {
            childList: true,
            subtree: true, // Monitor additions/removals in the entire subtree
        });

        // Initial scan for target divs already present in the DOM
        const initialTargetDivs = document.querySelectorAll(target_div);
        handleNewTargetDivs(Array.from(initialTargetDivs));
    } else {
        console.error('Document body not found. Observer cannot be set up.');
    }
}

// Add a message listener to handle toggle requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleMarkdown") {
        // **Update the global toggle state**
        isParsingToggledOff = !isParsingToggledOff; // Flip the global toggle state

        // Toggle the content of all processed elements
        processedElements.forEach(element => {
            if (isParsingToggledOff) {
                // Parsing is toggled off globally; show original element, hide parsed markdown
                element.style.display = '';
                if (element.__parsedDiv) {
                    element.__parsedDiv.style.display = 'none';
                }
                element.__isMarkdownToggled = true;

                // Start monitoring the original element for changes
                monitorOriginalElementForChanges(element);
            } else {
                // Parsing is toggled on globally; show parsed markdown, hide original element
                element.style.display = 'none';
                if (element.__parsedDiv) {
                    element.__parsedDiv.style.display = '';
                }
                element.__isMarkdownToggled = false;

                // Disconnect the observer on the original element to prevent unnecessary processing
                if (element.__editObserver) {
                    element.__editObserver.disconnect();
                    element.__editObserver = null;
                }
            }
        });
        sendResponse({ status: "toggled" });
    }
});

// Initialize the extension once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Extension initialized, setting up observers.');
    setupMainObserver();
});