import { marked } from 'marked';
const target_div = ".GCWeG";
const DEBOUNCE_DELAY = 700; // Adjust the delay as needed based on content streaming behavior

// Function to convert Markdown and apply it to the element
function convertMarkdownToHTML(element) {
    let markdownContent = element.innerText || element.textContent;

    // Remove ```markdown code fences at the start and end if present
    if (markdownContent.startsWith('```markdown')) {
        markdownContent = markdownContent.replace(/^```markdown\s*\n?/, '');
        markdownContent = markdownContent.replace(/\n?```$/, '');
    }

    const htmlContent = marked(markdownContent);

    // Replace the element's inner HTML with generated HTML
    element.innerHTML = htmlContent;
    console.log('Converted Markdown to HTML');

    // Adjust pre elements if needed
    const preElements = element.querySelectorAll('pre');
    preElements.forEach(pre => {
        pre.style.fontSize = '0.8rem';  // Adjust the font-size style if necessary
    });

    // **New code to adjust <code> elements**
    const codeElements = element.querySelectorAll('code');
    codeElements.forEach(codeElem => {
        codeElem.style.width = '-webkit-fill-available'; // Apply the desired CSS style
    });
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
        subtree: true
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
            // **Check if the element meets the new condition**
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
            subtree: true // Monitor additions/removals in the entire subtree
        });

        // Initial scan for target divs already present in the DOM
        const initialTargetDivs = document.querySelectorAll(target_div);
        handleNewTargetDivs(initialTargetDivs);
    } else {
        console.error('Document body not found. Observer cannot be set up.');
    }
}

// Initialize the extension once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.backgroundColor = "#ffffff";
    console.log('Extension initialized, setting up observers.');
    setupMainObserver();
});