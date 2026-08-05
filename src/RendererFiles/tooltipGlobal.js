let TOOLTIP_exists = false;

function TOOLTIP_show(textContent) {
    if (TOOLTIP_exists) {
        let tooltipElement = document.getElementById();
        // This is why I worry about doing a bool check in the other UIs
        // I worry about the state getting corrupted somehow.
        //
        // And then if it is truly meaningful from an optimization standpoint such as the scrolling of the editor
        // I take on the state corruption risk, otherwise I just defensively handle it.
        if (!tooltipElement) {
            TOOLTIP_exists = false;
            TOOLTIP_show(textContent);
        }
    }
    TOOLTIP_exists = true;
}

function TOOLTIP_hide() {
    TOOLTIP_exists = false;
}