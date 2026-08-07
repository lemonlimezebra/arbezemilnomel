let AUTOCOMPLETE_exists = false;

let AUTOCOMPLETE_pending_items = null;

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
        AUTOCOMPLETEElement.tabIndex = 0;
        document.body.appendChild(AUTOCOMPLETEElement);
        AUTOCOMPLETE_events_add(AUTOCOMPLETEElement);
    }
    
    //// This was quickest first way of writing things that came to my mind.
    //// I don't like it cause you're appending the child, then setting textContent
    //// but it is sufficient for the first version.
    ////AUTOCOMPLETEElement.textContent = ;
    
    let items = AUTOCOMPLETE_pending_items;
    AUTOCOMPLETE_pending_items = null;

    for (let i = 0; i < AUTOCOMPLETE_pending_items; i++) {
        let item = AUTOCOMPLETE_pending_items[i];
        let div = document.createElement('div');
        div.textContent = `applesauce ${item.label}`;
        AUTOCOMPLETEElement.append(div);
    }

    

    AUTOCOMPLETE_exists = true;

    /*
            
    If the entire thing isn't like something you have energy for
    then maybe you can identify a smaller functionality of autocomplete
    like a less correct one that has lots of functionality that you need
    for the final one and you have the code written and easily modifiable
    to the more complete one when you have energy.

    So like if I had ctrl+' ' the only way to bring it up
    And bringing it up moved focus to the autocomplete
    then I could easily hide the autocomplete because events would propagate from the menu element
    I can put listeners on it
    and essentially anything you do event wise causes it to close

    but this way I can have it so ctrl+' ' I have the lsp give me like the top level scope
    what the names of the nodes are like just gimme something I mean.
    
    */

    AUTOCOMPLETEElement.focus();
}

function AUTOCOMPLETE_show(items) {
    AUTOCOMPLETE_pending_items = items;
    AUTOCOMPLETE_render_request(1);
}

function AUTOCOMPLETE_render_do_hide() {
    const AUTOCOMPLETE = document.getElementById('AUTOCOMPLETE');
    if (AUTOCOMPLETE) {
        AUTOCOMPLETE_events_remove(AUTOCOMPLETE);
        AUTOCOMPLETE.remove();
    }

    AUTOCOMPLETE_exists = false;
}

function AUTOCOMPLETE_hide() {
    AUTOCOMPLETE_pending_items = null;
    AUTOCOMPLETE_render_request(2);
}

function AUTOCOMPLETE_events_add(AUTOCOMPLETEElement) {
    AUTOCOMPLETEElement.addEventListener('keydown', AUTOCOMPLETE_events_onkeydown);
}

function AUTOCOMPLETE_events_remove(AUTOCOMPLETEElement) {
    AUTOCOMPLETEElement.removeEventListener('keydown', AUTOCOMPLETE_events_onkeydown);
}

function AUTOCOMPLETE_events_onkeydown() {
    AUTOCOMPLETE_hide();
    if (EDITOR_baseElement) {
        EDITOR_baseElement.focus();
    }
}
