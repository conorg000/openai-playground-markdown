import { marked } from 'marked';
const target_div = ".GCWeG";

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

// Define the function to perform actions on target elements
function handleTargetDivs(elements) {
    elements.forEach(element => {
        if (!element.__processed) { // Avoid duplicate processing
            element.__processed = true;
            console.log(element);
            console.log("Processed a div with class 'target-div'");
            // Use a small delay to allow potential asynchronous text updates
            setTimeout(() => {
                const textContent = element.innerText || element.textContent;
                if (textContent.trim().length > 0) {
                    console.log(textContent);
                    convertMarkdownToHTML(element);
                }
            }, 50);  // Delay in milliseconds - adjust as needed
        }
    });
}

// Set up the observer once the document body is ready
function setupObserver() {
    const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // Query for all .target-div elements
                const targetDivs = document.querySelectorAll(target_div);
                handleTargetDivs(targetDivs);
            }
        }
    });

    // Observe the body for added nodes, ensuring it's a Node before observing
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
});

// Initial check for any .target-div already present on page load
document.addEventListener('DOMContentLoaded', setupObserver);