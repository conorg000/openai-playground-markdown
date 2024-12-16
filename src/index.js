import { marked } from 'marked';
const target_div = ".GCWeG";
const DEBOUNCE_DELAY = 500; // Adjust this delay as needed

// Function to convert Markdown and apply it to the element
function convertMarkdownToHTML(element) {
    const markdownContent = element.innerText || element.textContent;
    const htmlContent = marked(markdownContent);

    // Replace the element's inner HTML with generated HTML
    element.innerHTML = htmlContent;
    console.log('Converted Markdown to HTML');

    const preElements = element.querySelectorAll('pre');
    preElements.forEach(pre => {
        pre.style.fontSize = '0.8rem';  // Add the font-size style
    });
}

// Function to monitor a target div until its content is fully loaded
function monitorDivContent(element) {
    let debounceTimer;

    // Callback function for the child MutationObserver
    const contentObserverCallback = (mutationsList, observer) => {
        // Clear the existing timer whenever a mutation occurs
        clearTimeout(debounceTimer);

        // Set a new timer
        debounceTimer = setTimeout(() => {
            // Stop observing once content is considered fully loaded
            observer.disconnect();
            console.log(`Content fully loaded for element:`, element);

            // Process the markdown content
            convertMarkdownToHTML(element);
        }, DEBOUNCE_DELAY); // Wait for DEBOUNCE_DELAY milliseconds of inactivity
    };

    // Create a new MutationObserver for the element's content
    const contentObserver = new MutationObserver(contentObserverCallback);

    // Start observing the element for childList and characterData changes
    contentObserver.observe(element, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

// Define the function to perform actions on target elements
function handleTargetDivs(elements) {
    elements.forEach(element => {
        if (!element.__processed) { // Avoid duplicate processing
            element.__processed = true;
            console.log("Monitoring a new div with class 'GCWeG':", element);

            // Monitor the element's content until it's fully loaded
            monitorDivContent(element);
        }
    });
}

// Set up the observer once the document body is ready
function setupObserver() {
    const observer = new MutationObserver(mutationsList => {
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
                        handleTargetDivs(targetElements);
                    }
                });
            }
        });
    });

    // Observe the body for added nodes
    const body = document.body;
    if (body) {
        observer.observe(body, {
            childList: true,
            subtree: true // Monitor the entire subtree under the body
        });

        // Initial scan for elements already on the page
        const initialTargetDivs = document.querySelectorAll(target_div);
        handleTargetDivs(initialTargetDivs);
    } else {
        console.error('Document body not found. Observer cannot be set up.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.backgroundColor = "#ffffff";
    console.log('if u see this, good');
    setupObserver();
});