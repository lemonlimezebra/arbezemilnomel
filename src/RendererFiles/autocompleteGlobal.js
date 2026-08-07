let AUTOCOMPLETE_exists = false;

let AUTOCOMPLETE_pending_textContent = null;

/**
 * 0 => None
 * 1 => Show
 * 2 => Hide
 */
let AUTOCOMPLETE_pending_renderKind = 0;
let AUTOCOMPLETE_isRenderPending = false;

function AUTOCOMPLETE_render_request(renderKind) {
    AUTOCOMPLETE_pending_renderKind = renderKind;
    
    if (!AUTOCOMPLETE_isRenderPending) {
        AUTOCOMPLETE_isRenderPending = true;
        requestAnimationFrame(AUTOCOMPLETE_renderDo);
    }
}

function AUTOCOMPLETE_renderDo() {
    let renderKind = AUTOCOMPLETE_pending_renderKind;
    AUTOCOMPLETE_pending_renderKind = 0;

    if (renderKind === 1) {
        AUTOCOMPLETE_render_do_show();
    }
    else if (renderKind === 2) {
        AUTOCOMPLETE_render_do_hide();
    }
    else {
        throw new Error();
    }
    
    AUTOCOMPLETE_isRenderPending = false; // Reset the paint lock
};

function AUTOCOMPLETE_render_do_show() {
    AUTOCOMPLETE_render_request(1);

    let AUTOCOMPLETEElement;

    if (AUTOCOMPLETE_exists) {
        AUTOCOMPLETEElement = document.getElementById('AUTOCOMPLETE');
        // This is why I worry about doing a bool check in the other UIs
        // I worry about the state getting corrupted somehow.
        //
        // And then if it is truly meaningful from an optimization standpoint such as the scrolling of the editor
        // I take on the state corruption risk, otherwise I just defensively handle it.
        if (!AUTOCOMPLETEElement) {
            AUTOCOMPLETE_exists = false;
            AUTOCOMPLETE_show(textContent);
            return;
        }
    }
    else {
        AUTOCOMPLETEElement = document.createElement('div');
        AUTOCOMPLETEElement.id = 'AUTOCOMPLETE';
        AUTOCOMPLETEElement.style.left = '0px';
        AUTOCOMPLETEElement.style.top = '0px';
        document.body.appendChild(AUTOCOMPLETEElement);
    }
    
    // This was quickest first way of writing things that came to my mind.
    // I don't like it cause you're appending the child, then setting textContent
    // but it is sufficient for the first version.
    AUTOCOMPLETEElement.textContent = AUTOCOMPLETE_pending_textContent;
    AUTOCOMPLETE_pending_textContent = null;

    AUTOCOMPLETE_exists = true;
}

function AUTOCOMPLETE_show(textContent) {
    AUTOCOMPLETE_pending_textContent = textContent;
    AUTOCOMPLETE_render_request(1);
}

function AUTOCOMPLETE_render_do_hide() {
    const AUTOCOMPLETE = document.getElementById('AUTOCOMPLETE');
    if (AUTOCOMPLETE) {
        AUTOCOMPLETE.remove();
    }

    AUTOCOMPLETE_exists = false;
}

function AUTOCOMPLETE_hide() {
    AUTOCOMPLETE_pending_textContent = null;
    AUTOCOMPLETE_render_request(2);
}
