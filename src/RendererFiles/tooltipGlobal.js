let TOOLTIP_exists = false;

function TOOLTIP_show(textContent) {

    let tooltipElement;

    if (TOOLTIP_exists) {
        tooltipElement = document.getElementById('TOOLTIP');
        // This is why I worry about doing a bool check in the other UIs
        // I worry about the state getting corrupted somehow.
        //
        // And then if it is truly meaningful from an optimization standpoint such as the scrolling of the editor
        // I take on the state corruption risk, otherwise I just defensively handle it.
        if (!tooltipElement) {
            TOOLTIP_exists = false;
            TOOLTIP_show(textContent);
            return;
        }
    }
    else {
        tooltipElement = document.createElement('div');
        tooltipElement.id = 'TOOLTIP';
        tooltipElement.style.left = '0px';
        tooltipElement.style.top = '0px';
        document.body.appendChild(tooltipElement);
    }
    
    // This was quickest first way of writing things that came to my mind.
    // I don't like it cause you're appending the child, then setting textContent
    // but it is sufficient for the first version.
    tooltipElement.textContent = textContent;

    TOOLTIP_exists = true;
}

function TOOLTIP_hide() {

    const tooltip = document.getElementById('TOOLTIP');
    if (tooltip) {
        tooltip.remove();
    }

    TOOLTIP_exists = false;
}