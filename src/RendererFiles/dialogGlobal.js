//__#__
// preprocessor.cjs
import "./fieldBuffer"
//__#__

const get_DialogKind_None = () => "None";
const get_DialogKind_FindAll = () => "FindAll";
const get_DialogKind_Settings = () => "Settings";
const get_DialogKind_DocumentSymbol = () => "DocumentSymbol";
const get_DialogKind_Debug = () => "Debug";

let DIALOG_currentDialogKind = get_DialogKind_None();

/** A delegate of the form: () => {} */
let DIALOG_onResizeAction = null;
let DIALOG_restoreFocusToElement = null;
let DIALOG_HIDE_shouldRestoreFocus = true;

let DIALOG_windowExists = false;

let DIALOG_hasBeenMeaasured = false;

let DIALOG_SHOW_restoreFocusToElement = null;
let DIALOG_SHOW_currentDialogKind = get_DialogKind_None();
let DIALOG_SHOW_onResizeAction = null;

/**
 * defaults to viewport size then getBoundingClientRect says the exact pixels upon trying to resize
 * need to track resizes and store the useragent width/height by the onmousedown and then on resize get proportion and update left top width height.
 */
let DIALOG_left = 0;
let DIALOG_top = 0;
let DIALOG_width = 0;
let DIALOG_height = 0;

let DIALOG_left_DRAWN = 0;
let DIALOG_top_DRAWN = 0;
let DIALOG_width_DRAWN = 0;
let DIALOG_height_DRAWN = 0;

let DIALOG_before_X = 0;
let DIALOG_before_Y = 0;

let DIALOG_after_X = 0;
let DIALOG_after_Y = 0;

let DIALOG_FindAll_options_matchWord = false;

let DIALOG_Settings_isDark = true;
let DIALOG_Settings_trueTabs_falseSpaces = true;
let DIALOG_Settings_editorDebugShowAdjacentCharacters = false;

let DIALOG_renderKindArray = [];
let DIALOG_isRenderPending = false;

//let DIALOG_ArrayFrom_menuOptionList_children = [];

const get_DIALOGrenderKind_None = () => 0;
const get_DIALOGrenderKind_Show = () => 1;
const get_DIALOGrenderKind_Hide = () => 2;
const get_DIALOGrenderKind_DimensionsChanged = () => 3;

function DIALOG_render_request(renderKind) {
    if (DIALOG_renderKindArray[DIALOG_renderKindArray.length - 1] !== renderKind) {
        DIALOG_renderKindArray.push(renderKind);
    }
    
    if (!DIALOG_isRenderPending) {
        DIALOG_isRenderPending = true;
        requestAnimationFrame(DIALOG_render_do);
    }
}

function DIALOG_render_do() {
    let renderKind;
    
    while (renderKind = DIALOG_renderKindArray.shift()) {
        switch (renderKind) {
            case get_DIALOGrenderKind_Show():
                DIALOG_render_do_Show();
                break;
            case get_DIALOGrenderKind_Hide():
                DIALOG_render_do_Hide();
                break;
            case get_DIALOGrenderKind_DimensionsChanged():
                DIALOG_render_do_DimensionsChanged();
                break;
        }
    }
    
    DIALOG_isRenderPending = false; // Reset the paint lock
}

function DIALOG_render_do_DimensionsChanged() {
    let DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    // This logic is a bit suspect.
    // Are doubles involved?
    // Do those doubles compare accurately enough?
    // Is using a boolean a better idea?

/*

Google AI

> how often does a resize event fire at the fastest possible speed

< At its absolute fastest speed, a browser window resize event fires every single pixel change (or continuously during the drag loop),
< meaning it can trigger hundreds of times per second (often matching or exceeding the main thread's processing capacity,
< up to 1,000+ times per second if unrestricted

> I have a dialog UI that is moveable and resizable.
> When it initially renders it has a whole number for the width, height, left, top.
> When I perform the first drag event it tends to get a decimal ending for the previously named properties.
> Then as I continue dragging, this decimal ending stays exactly the same.
> 
> Can you confirm whether what I'm seeing is expected behavior? That after the initial event,
> I'd only ever see a mouseEvent to update the css property values after the mouse event has changed by exactly 1 pixel?
> I'd presume this isn't true actually... because you could move 1 pixel by perhaps combining the x and y axis,
> or that either the x or y hit the 1 pixel threshold but the other dimension is a decimal amount of space having moved?

< ...
< What you are observing with the stable decimal endings is expected, but it is caused by browser subpixel rendering and how you calculate the coordinate offsets—not because the mouse is restricted to 1-pixel grid increments
< ...
< The Initial Render: Your element starts at a clean, whole number (e.g., width: 400px).
< The First Move: When you click and first move, the browser calculates the bounding box using subpixel precision
<                 (often due to display scaling, like a 125% or 150% Windows zoom, or a Retina display). This introduces a fractional offset (e.g., left: 100.33px)
< The Delta Loop: In every subsequent mouse event, the browser gives you the mouse coordinates. Crucially, the mouse coordinates (clientX/clientY) are usually reported as integers (whole numbers) by the browser relative to the screen.
< The Constant Fraction: Because you are subtracting a whole-number mouse coordinate from another whole-number mouse coordinate, your delta (\(\Delta \)) is always a perfect integer. When you add that perfect integer delta to your first subpixel position, the decimal fraction never changes!

> I have a rAF loop that updates the CSS properties of the dialog.
> When there is a decimal ending involved. Does this math have enough accuracy to be correct? 'if (DIALOG_left_DRAWN !== DIALOG_left) { ...changeTheProperties... }'

< ...

> ...

< ...

> ...

< No, a strict equality check (!==) is not safe when comparing decimal numbers in JavaScript.
< ...
< 2. Snap to Pixels (Best for UI Performance)
< Monitors cannot light up a "fractional" physical pixel. A value like 100.33px forces the browser to anti-alias the edge, which often looks blurry.
< Snapping to the nearest whole pixel yields sharper text and faster performance.
< ```js
< const targetLeft = Math.round(DIALOG_left); // or Math.floor
< 
< if (DIALOG_left_DRAWN !== targetLeft) {
<   // Update your CSS properties using targetLeft
<   DIALOG_left_DRAWN = targetLeft;
< }
< ```
< ...

> I have a very related question, it is about a text editor UI that I have.
> Given the switch from a dialog to a text editor, I want to just make sure you're on track by providing this single prompt to start.

< ...

> My editor initialization and resize logic both invoke the same shared function at some point.
> 
> This function is:
> ```js
> function EDITOR_measureBaseElement() {
>     lastReadNumber_offsetWidth = Math.floor(EDITOR_baseElement.offsetWidth);
>     lastReadNumber_offsetHeight = Math.floor(EDITOR_baseElement.offsetHeight);
>     
>     EDITOR_baseElement.style.width = lastReadNumber_offsetWidth + 'px';
>     EDITOR_baseElement.style.height = lastReadNumber_offsetHeight + 'px';
>     EDITOR_baseElement.style.contain = 'layout';
> 
>     lastReadNumber_offsetWidth = EDITOR_baseElement.offsetWidth;
>     lastReadNumber_offsetHeight = EDITOR_baseElement.offsetHeight;
> }
> ```

< Your function contains a classic, severe performance anti-pattern known as Layout Thrashing (forced synchronous layout).
< Because it mixes DOM reading and DOM writing back-to-back, it forces the browser to recalculate the page layout twice every single time the function runs.
< ...
< ...
< Alternatively, if you are looking to get precise fractional measurements without rounding issues, use getBoundingClientRect() instead of offsetWidth:
< ...
< function EDITOR_measureBaseElement() {
<     // 1. Read everything first (No thrashing)
<     const rect = EDITOR_baseElement.getBoundingClientRect();
<     
<     // 2. Do your math locally
<     const targetWidth = Math.floor(rect.width);
<     const targetHeight = Math.floor(rect.height);
<     
<     // 3. Write everything last
<     EDITOR_baseElement.style.width = targetWidth + 'px';
<     EDITOR_baseElement.style.height = targetHeight + 'px';
<     EDITOR_baseElement.style.contain = 'layout';
< 
<     // 4. Update your cached tracking variables without re-reading the DOM
<     lastReadNumber_offsetWidth = targetWidth;
<     lastReadNumber_offsetHeight = targetHeight;
< }
<
< Could you share why you need to hardcode the floored width/height back onto the element's style instead of letting it size naturally?
< Knowing if you are trying to align a text grid or prevent canvas blurring will help tailor the perfect setup.

> I actually never had a "need" to do this.
> 
> The idea started due to how I calculate the amount of lines to show on the screen.
> 
> I take the 'elementHeight' and divide by the 'lineHeight'.
> 
> And I assumed it would be best if 'elementHeight' were a whole number.
> 
> Generally speaking however, I also do have an underlying assumption that the browser can more easily render a UI if it is encompassed within an element which has whole numbered dimensions. (which might be wrong).

< ...
< Fact Check: Can Browsers Render Whole Numbers More Easily?
< No, they do not find it easier.
< Modern browsers use hardware acceleration (GPU rendering) and subpixel anti-aliasing.
< They are perfectly optimized to handle elements with fractional dimensions like 500.67px.
< 
< However, your assumption holds true for visual crispness:
< The Good: Giving an element a whole-number bounding box ensures its outer borders align perfectly with physical screen pixels, preventing blurry edges.
< The Bad: Forcing a fractional element to become a whole number by altering its .style.width or .style.height (especially on high-DPI/Retina screens) forces the browser to trigger a full layout recalculation. The performance cost of forcing the whole number is vastly higher than the rendering cost of letting the decimal exist naturally.
<
< The Text Layout Problem (Why Your Math Breaks)
< Your formula (elementHeight / lineHeight) to find the visible line count is standard practice. However, trying to make elementHeight a whole number does not guarantee a clean line count.
< This is because lineHeight is rarely a whole number, even if you set it to one in CSS.
< ...

*/

    if (DIALOG_left_DRAWN !== DIALOG_left) {
        DIALOG_left_DRAWN = DIALOG_left;
        DIALOG_element.style.left = `${DIALOG_left_DRAWN}px`;
    }
    if (DIALOG_top_DRAWN !== DIALOG_top) {
        DIALOG_top_DRAWN = DIALOG_top;
        DIALOG_element.style.top = `${DIALOG_top_DRAWN}px`;
    }
    if (DIALOG_width_DRAWN !== DIALOG_width) {
        DIALOG_width_DRAWN = DIALOG_width;
        DIALOG_element.style.width = `${DIALOG_width_DRAWN}px`;
    }
    if (DIALOG_height_DRAWN !== DIALOG_height) {
        DIALOG_height_DRAWN = DIALOG_height;
        DIALOG_element.style.height = `${DIALOG_height_DRAWN}px`;
    }
    
}

async function DIALOG_render_do_Show() {
    if (DIALOG_currentDialogKind !== get_DialogKind_None()) {
        DIALOG_HIDE_shouldRestoreFocus = true;
        await DIALOG_render_do_Hide();
    }

    let DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) {
        DIALOG_element = document.createElement('div');
        DIALOG_element.id = "DIALOG";
        document.body.appendChild(DIALOG_element);
    }

    DIALOG_restoreFocusToElement = DIALOG_SHOW_restoreFocusToElement;
    DIALOG_currentDialogKind = DIALOG_SHOW_currentDialogKind;
    DIALOG_onResizeAction = DIALOG_SHOW_onResizeAction;

    DIALOG_createWindow();

    switch (DIALOG_currentDialogKind) {
        case get_DialogKind_FindAll():
            return DIALOG_FindAll_Create_async();
        case get_DialogKind_Settings():
            return DIALOG_Settings_Create_async();
        case get_DialogKind_DocumentSymbol():
            return DIALOG_DocumentSymbol_Create_async();
        case get_DialogKind_Debug():
            return DIALOG_Debug_Create_async();
    }
}

async function DIALOG_show_async(dialogKind, onResizeAction) {    
    DIALOG_SHOW_restoreFocusToElement = document.activeElement;
    DIALOG_SHOW_currentDialogKind = dialogKind;
    DIALOG_SHOW_onResizeAction = onResizeAction;
    DIALOG_render_request(get_DIALOGrenderKind_Show());
}

async function DIALOG_render_do_Hide() {
    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    switch (DIALOG_currentDialogKind) {
        case get_DialogKind_FindAll():
            await DIALOG_FindAll_Delete_async();
            break;
        case get_DialogKind_Settings():
            await DIALOG_Settings_Delete_async();
            break;
        case get_DialogKind_DocumentSymbol():
            await DIALOG_DocumentSymbol_Delete_async();
            break;
        case get_DialogKind_Debug():
            await DIALOG_Debug_Delete_async();
            break;
    }

    DIALOG_deleteWindow();

    DIALOG_onResizeAction = null;
    DIALOG_element.remove();
    DIALOG_currentDialogKind = get_DialogKind_None();
    if (shouldRestoreFocus) {
        if (DIALOG_restoreFocusToElement) {
            DIALOG_restoreFocusToElement.focus();
        }
        DIALOG_restoreFocusToElement = null;
    }
}

function DIALOG_hide_request(shouldRestoreFocus) {
    DIALOG_HIDE_shouldRestoreFocus = shouldRestoreFocus;
    DIALOG_render_request(get_DIALOGrenderKind_Hide());
}

function DIALOG_closeButton_onclick() {
    DIALOG_hide_request(true);
}

function DIALOG_resize_onmouseenter(event) {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    if (event.buttons & 1) {
        // while resizing you went from one end to the other and it bugged out
        return;
    }

    let resize = document.getElementById('DIALOG_resize');
    if (!resize) return;

    // TODO: cache the bounding client rect
    let dialogBoundingClientRect = DIALOG_element.getBoundingClientRect();

    DIALOG_resize_setCursor(event, dialogBoundingClientRect, resize);
}

function DIALOG_resize_onmousedown(event) {
    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    let resize = document.getElementById('DIALOG_resize');
    if (!resize) return;

    // TODO: cache the bounding client rect
    let dialogBoundingClientRect = DIALOG_element.getBoundingClientRect();

    DIALOG_resize_setCursor(event, dialogBoundingClientRect, resize);

    DIALOG_before_X = event.clientX;
    DIALOG_before_Y = event.clientY;
    DIALOG_after_X = 0;
    DIALOG_after_Y = 0;

    DIALOG_left = dialogBoundingClientRect.left;
    DIALOG_top = dialogBoundingClientRect.top;
    DIALOG_width = dialogBoundingClientRect.width;
    DIALOG_height = dialogBoundingClientRect.height;
    DIALOG_hasBeenMeaasured = true;

    document.body.classList.add('unselectable');
    window.addEventListener('mousemove', DIALOG_resize_body_onmousemove, /*useCapture*/ true);

/*
> I have a dialog UI that is moveable and resizeable. When I mousedown in the usual locations, it lets me resize it.
> 
> document.body.classList.add('unselectable');
>     window.addEventListener('mousemove', DIALOG_resize_body_onmousemove, true);
> 
> What do you think of how I'm subscribing here?

< ...
<
< However, using useCapture: true here is actually causing a subtle bug that you likely have run into—or will soon.
< 
< ...
*/
}

/**
 * does not redraw, only preps the state to be redrawn
 */
function DIALOG_n_resize_calcOnly(diff_Y, clientY) {
    if (diff_Y < 0) {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_top <= get_DIALOG_minTop()) {
            return; // TODO: ...
        }
        else if (DIALOG_top - absdiff_Y < get_DIALOG_minTop()) {
            clientY += (absdiff_Y - (DIALOG_top - get_DIALOG_minTop()));
            absdiff_Y = DIALOG_top - get_DIALOG_minTop();
        }
        DIALOG_top -= absdiff_Y;
        DIALOG_height += absdiff_Y;
        DIALOG_before_Y = clientY;
    }
    else {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_height <= get_DIALOG_minHeight()) {
            return; // TODO: ...
        }
        else if (DIALOG_height - absdiff_Y < get_DIALOG_minHeight()) {
            clientY -= (absdiff_Y - (DIALOG_height - get_DIALOG_minHeight()));
            absdiff_Y = DIALOG_height - get_DIALOG_minHeight();
        }
        DIALOG_height -= absdiff_Y;
        DIALOG_top += absdiff_Y;
        DIALOG_before_Y = clientY;
    }
}

/** does not redraw, only preps the state to be redrawn */
function DIALOG_e_resize_calcOnly(diff_X, clientX) {
    if (diff_X < 0) {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_width <= get_DIALOG_minWidth()) {
            return; // TODO: ...
        }
        else if (DIALOG_width - absdiff_X < get_DIALOG_minWidth()) {
            clientX += (absdiff_X - (DIALOG_width - get_DIALOG_minWidth()));
            absdiff_X = DIALOG_width - get_DIALOG_minWidth();
        }
        DIALOG_width -= absdiff_X;
        DIALOG_before_X = clientX;
    }
    else {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_left + DIALOG_width + 8 >= window.innerWidth) {
            return; // TODO: ...
        }
        else if (DIALOG_left + DIALOG_width + 8 + absdiff_X > window.innerWidth) {
            let DIALOG_maxWidth = window.innerWidth - 8 - DIALOG_left;
            clientX -= (absdiff_X - (DIALOG_maxWidth - DIALOG_width));
            absdiff_X = DIALOG_maxWidth - DIALOG_width;
        }
        DIALOG_width += absdiff_X;
        DIALOG_before_X = clientX;
    }
}

/** does not redraw, only preps the state to be redrawn */
function DIALOG_s_resize_calcOnly(diff_Y, clientY) {
    if (diff_Y < 0) {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_height <= get_DIALOG_minHeight()) {
            return; // TODO: ...
        }
        else if (DIALOG_height - absdiff_Y < get_DIALOG_minHeight()) {
            // tighten in the other direction because overshoot
            clientY += (absdiff_Y - (DIALOG_height - get_DIALOG_minHeight()));
            absdiff_Y = DIALOG_height - get_DIALOG_minHeight();
        }
        DIALOG_height -= absdiff_Y;
        DIALOG_before_Y = clientY;
    }
    else {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_top + 8 + DIALOG_height >= window.innerHeight) {
            return; // TODO: ...
        }
        else if (DIALOG_top + 8 + DIALOG_height + absdiff_Y > window.innerHeight) {
            // tighten in the other direction because overshoot
            // -8 is the hardcoded pixel size that the resize element overhangs the dialog.
            let DIALOG_maxHeight = window.innerHeight - 8 - DIALOG_top;
            clientY -= (absdiff_Y - (DIALOG_maxHeight - DIALOG_height));
            absdiff_Y = DIALOG_maxHeight - DIALOG_height;
        }
        DIALOG_height += absdiff_Y;
        DIALOG_before_Y = clientY;
    }
}

/** does not redraw, only preps the state to be redrawn */
function DIALOG_w_resize_calcOnly(diff_X, clientX) {
    if (diff_X < 0) {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_left <= get_DIALOG_minLeft()) {
            return; // TODO: ...
        }
        else if (DIALOG_left - absdiff_X < get_DIALOG_minLeft()) {
            clientX += (absdiff_X - (DIALOG_left - get_DIALOG_minLeft()));
            absdiff_X = DIALOG_left - get_DIALOG_minLeft();
        }
        DIALOG_width += absdiff_X;
        DIALOG_left -= absdiff_X;
        DIALOG_before_X = clientX;
    }
    else {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_width <= get_DIALOG_minWidth()) {
            return; // TODO: ...
        }
        else if (DIALOG_width - absdiff_X < get_DIALOG_minWidth()) {
            clientX += (absdiff_X - (DIALOG_width - get_DIALOG_minWidth()));
            absdiff_X = DIALOG_width - get_DIALOG_minWidth();
        }
        DIALOG_width -= absdiff_X;
        DIALOG_left += absdiff_X;
        DIALOG_before_X = clientX;
    }
}

function DIALOG_resize_body_onmousemove(event) {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    let resize = document.getElementById('DIALOG_resize');
    if (!resize) return;

    if (event.buttons & 1) {
        // TODO: I literally can't even right now with this empty if statement
    }
    else {
        document.body.classList.remove('unselectable');
        window.removeEventListener('mousemove', DIALOG_resize_body_onmousemove, /*useCapture*/ true);
        if (DIALOG_onResizeAction) DIALOG_onResizeAction();
        return;
    }

    let diff_X = event.clientX - DIALOG_before_X;
    let diff_Y = event.clientY - DIALOG_before_Y;

    if (diff_Y > -1 && diff_Y < 1) diff_Y = 0;
    if (diff_X > -1 && diff_X < 1) diff_X = 0;

    if (diff_X === 0 && diff_Y === 0) {
        return;
    }

    let clientX = event.clientX;
    let clientY = event.clientY;

    switch (resize.style.cursor) {
        case 'nw-resize':
            DIALOG_n_resize_calcOnly(diff_Y, clientY);
            DIALOG_w_resize_calcOnly(diff_X, clientX);
            break;
        case 'w-resize':
            DIALOG_w_resize_calcOnly(diff_X, clientX);
            break;
        case 'sw-resize':
            DIALOG_s_resize_calcOnly(diff_Y, clientY);
            DIALOG_w_resize_calcOnly(diff_X, clientX);
            break;
        case 'n-resize':
            DIALOG_n_resize_calcOnly(diff_Y, clientY);
            break;
        case 's-resize':
            DIALOG_s_resize_calcOnly(diff_Y, clientY);
            break;
        case 'ne-resize':
            DIALOG_n_resize_calcOnly(diff_Y, clientY);
            DIALOG_e_resize_calcOnly(diff_X, clientX);
            break;
        case 'e-resize':
            DIALOG_e_resize_calcOnly(diff_X, clientX);
            break;
        case 'se-resize':
            DIALOG_s_resize_calcOnly(diff_Y, clientY);
            DIALOG_e_resize_calcOnly(diff_X, clientX);
            break;
        default:
            return;
    }

    DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
}

function DIALOG_resize_setCursor(event, dialogBoundingClientRect, resize) {
    let rX = event.clientX - dialogBoundingClientRect.left;
    let rY = event.clientY - dialogBoundingClientRect.top;
    // left to right
    //     top to bottom
    if (rX < 0) {
        if (rY < 0) {
            resize.style.cursor = 'nw-resize';
        }
        else if (event.clientY < dialogBoundingClientRect.top + dialogBoundingClientRect.height) {
            resize.style.cursor = 'w-resize';
        }
        else {
            resize.style.cursor = 'sw-resize';
        }
    }
    else if (event.clientX < dialogBoundingClientRect.left + dialogBoundingClientRect.width) {
        if (rY < 0) {
            resize.style.cursor = 'n-resize';
        }
        else if (event.clientY < dialogBoundingClientRect.top + dialogBoundingClientRect.height) {
            //resize.style.cursor = 'ns-resize';
        }
        else {
            resize.style.cursor = 's-resize';
        }
    }
    else {
        if (rY < 0) {
            resize.style.cursor = 'ne-resize';
        }
        else if (event.clientY < dialogBoundingClientRect.top + dialogBoundingClientRect.height) {
            resize.style.cursor = 'e-resize';
        }
        else {
            resize.style.cursor = 'se-resize';
        }
    }
}

/** This is the wellknown JS window object: 'window.addEventListener...' not to be confused with what I call the "window" of the dialog. */
function DIALOG_window_onresize() {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    if (!DIALOG_hasBeenMeaasured) return;

    // Max width and min width depend on the left/top so they need to come first.
    if (DIALOG_left <= get_DIALOG_minLeft()) {
        DIALOG_left = get_DIALOG_minLeft();
        DIALOG_element.style.left = DIALOG_left + 'px';
    }
    if (DIALOG_top <= get_DIALOG_minTop()) {
        DIALOG_top = get_DIALOG_minTop();
        DIALOG_element.style.top = DIALOG_top + 'px';
    }

    if (DIALOG_height <= get_DIALOG_minHeight()) {
        DIALOG_height = get_DIALOG_minHeight();
        DIALOG_element.style.height = DIALOG_height + 'px';
    }
    else if (DIALOG_height + DIALOG_top + 8 >= window.innerHeight) {
        DIALOG_height = window.innerHeight - 8 - DIALOG_top;
        DIALOG_element.style.height = DIALOG_height + 'px';
    }

    if (DIALOG_width <= get_DIALOG_minWidth()) {
        DIALOG_width = get_DIALOG_minWidth();
        DIALOG_element.style.width = DIALOG_width + 'px';
    }	
    else if (DIALOG_left + DIALOG_width + 8 >= window.innerWidth) {
        DIALOG_width = window.innerWidth - 8 - DIALOG_left;
        DIALOG_element.style.width = DIALOG_width + 'px';
    }
}

function DIALOG_toolbar_body_onmousemove(event) {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    let resize = document.getElementById('DIALOG_resize');
    if (!resize) return;

    if (event.buttons & 1) {
        // TODO: I literally can't even right now with this empty if statement
    }
    else {
        document.body.classList.remove('unselectable');
        window.removeEventListener('mousemove', DIALOG_toolbar_body_onmousemove, /*useCapture*/ true);
        if (DIALOG_onResizeAction) DIALOG_onResizeAction();
        return;
    }

    let diff_X = event.clientX - DIALOG_before_X;
    let diff_Y = event.clientY - DIALOG_before_Y;

    if (diff_Y > -1 && diff_Y < 1) diff_Y = 0;
    if (diff_X > -1 && diff_X < 1) diff_X = 0;

    if (diff_X === 0 && diff_Y === 0) {
        return;
    }

    let clientX = event.clientX;
    let clientY = event.clientY;

    if (diff_X < 0) {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_left <= get_DIALOG_minLeft()) {
            //return; // TODO: ...
        }
        else if (DIALOG_left - absdiff_X < get_DIALOG_minLeft()) {
            clientX += (absdiff_X - (DIALOG_left - get_DIALOG_minLeft()));
            absdiff_X = DIALOG_left - get_DIALOG_minLeft();

            DIALOG_left -= absdiff_X;
            DIALOG_before_X = clientX;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
        else {
            DIALOG_left -= absdiff_X;
            DIALOG_before_X = clientX;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
    }
    else if (diff_X > 0) {
        let absdiff_X = Math.abs(diff_X);
        if (DIALOG_left + DIALOG_width + 8 >= window.innerWidth) {
            //return; // TODO: ...
        }
        else if (DIALOG_left + DIALOG_width + 8 + absdiff_X > window.innerWidth) {
            let DIALOG_maxLeft = window.innerWidth - 8 - DIALOG_width;
            clientX -= (absdiff_X - (DIALOG_maxLeft - DIALOG_left));
            absdiff_X = DIALOG_maxLeft - DIALOG_left;

            DIALOG_left += absdiff_X;
            DIALOG_before_X = clientX;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
        else {
            DIALOG_left += absdiff_X;
            DIALOG_before_X = clientX;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
    }

    if (diff_Y < 0) {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_top <= get_DIALOG_minTop()) {
            //return; // TODO: ...
        }
        else if (DIALOG_top - absdiff_Y < get_DIALOG_minTop()) {
            clientY += (absdiff_Y - (DIALOG_top - get_DIALOG_minTop()));
            absdiff_Y = DIALOG_top - get_DIALOG_minTop();
            
            DIALOG_top -= absdiff_Y;
            DIALOG_before_Y = clientY;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
        else {
            DIALOG_top -= absdiff_Y;
            DIALOG_before_Y = clientY;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
    }
    else if (diff_Y > 0) {
        let absdiff_Y = Math.abs(diff_Y);
        if (DIALOG_top + 8 + DIALOG_height >= window.innerHeight) {
            //return; // TODO: ...
        }
        else if (DIALOG_top + 8 + DIALOG_height + absdiff_Y > window.innerHeight) {
            let DIALOG_maxTop = window.innerHeight - 8 - DIALOG_height;
            clientY -= (absdiff_Y - (DIALOG_maxTop - DIALOG_top));
            absdiff_Y = DIALOG_maxTop - DIALOG_top;
            
            DIALOG_top += absdiff_Y;
            DIALOG_before_Y = clientY;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
        else {
            DIALOG_top += absdiff_Y;
            DIALOG_before_Y = clientY;
            DIALOG_render_request(get_DIALOGrenderKind_DimensionsChanged());
        }
    }
}

function DIALOG_toolbar_onmousedown(event) {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    let resize = document.getElementById('DIALOG_toolbar');
    if (!resize) return;

    // TODO: cache the bounding client rect
    let dialogBoundingClientRect = DIALOG_element.getBoundingClientRect();

    DIALOG_before_X = event.clientX;
    DIALOG_before_Y = event.clientY;
    DIALOG_after_X = 0;
    DIALOG_after_Y = 0;

    DIALOG_left = dialogBoundingClientRect.left;
    DIALOG_top = dialogBoundingClientRect.top;
    DIALOG_width = dialogBoundingClientRect.width;
    DIALOG_height = dialogBoundingClientRect.height;
    DIALOG_hasBeenMeaasured = true;

    document.body.classList.add('unselectable');
    window.addEventListener('mousemove', DIALOG_toolbar_body_onmousemove, /*useCapture*/ true);
}

/**
 * Window is the title bar, maximize, minimize, close etc...
 */
function DIALOG_createWindow() {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    // TODO: Might want to check if the HTML element exists instead.
    if (DIALOG_windowExists) return;
    DIALOG_windowExists = true;

    let toolbar = document.createElement('div');
    toolbar.id = 'DIALOG_toolbar';
    let body = document.createElement('div');
    body.id = 'DIALOG_body';
    let resize = document.createElement('div');
    resize.id = 'DIALOG_resize';

    toolbar.addEventListener('mousedown', DIALOG_toolbar_onmousedown);

    resize.addEventListener('mouseenter', DIALOG_resize_onmouseenter);
    resize.addEventListener('mousedown', DIALOG_resize_onmousedown);
    window.addEventListener('resize', DIALOG_window_onresize);

    DIALOG_element.appendChild(resize);
    DIALOG_element.appendChild(toolbar);
    DIALOG_element.appendChild(body);

    // TODO: You have to actually make sure the text fits
    toolbar.textContent = DIALOG_currentDialogKind;

    let closeButton = document.createElement('button');
    closeButton.textContent = 'x';
    closeButton.id = 'DIALOG_closeButton';

    closeButton.addEventListener('click', DIALOG_closeButton_onclick);

    toolbar.appendChild(closeButton);

    closeButton.focus();
}

/**
 * Window is the title bar, maximize, minimize, close etc...
 */
function DIALOG_deleteWindow() {

    const DIALOG_element = document.getElementById('DIALOG');
    if (!DIALOG_element) return;

    // TODO: Might want to check if the HTML element exists instead.
    if (!DIALOG_windowExists) return;
    // TODO: Perhaps move these respective sets to the end of their functions.
    // This way them being set as a certain value reflects that the entirety of their respective code had been ran but then again... idk
    DIALOG_windowExists = false;

    DIALOG_left = 0;
    DIALOG_top = 0;
    DIALOG_width = 0;
    DIALOG_height = 0;

    DIALOG_before_X = 0;
    DIALOG_before_Y = 0;
    DIALOG_after_X = 0;
    DIALOG_after_Y = 0;

    let toolbar = document.getElementById('DIALOG_toolbar');
    toolbar.removeEventListener('mousedown', DIALOG_toolbar_onmousedown);

    document.body.classList.remove('unselectable');
    window.removeEventListener('mousemove', DIALOG_resize_body_onmousemove, /*useCapture*/ true);
    window.removeEventListener('mousemove', DIALOG_toolbar_body_onmousemove, /*useCapture*/ true);
    if (DIALOG_onResizeAction) DIALOG_onResizeAction();

    window.removeEventListener('resize', DIALOG_window_onresize);

    let resize = document.getElementById('DIALOG_resize');
    resize.removeEventListener('mouseenter', DIALOG_resize_onmouseenter);
    resize.removeEventListener('mousedown', DIALOG_resize_onmousedown);

    let closeButton = document.getElementById('DIALOG_closeButton');
    closeButton.removeEventListener('click', DIALOG_closeButton_onclick);
}
