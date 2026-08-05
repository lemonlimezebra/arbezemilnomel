const get_WidgetKind_None = () => 0;
const get_WidgetKind_InputText = () => 1;
const get_WidgetKind_YesCancel = () => 2;

const get_WIDGETrenderKind_None = () => 0;
const get_WIDGETrenderKind_Show = () => 1;
const get_WIDGETrenderKind_Hide = () => 2;

/**
 * @callback MENU_Callback
 * @param {Object} options - The response object.
 * @param {boolean} [options.isCancelled=false] - Indicates if the action was cancelled.
 * @param {string} [options.value=''] - The data string returned.
 * @returns {Promise}
 */

/**
 * start it at 1 because you thought about starting it at 0 then using a prefix incrementation to ensure the 0 state is never used as a means of detecting an empty state
 * but if someone changes the code and moves it to postfix incrementation then everything breaks so why even take that risk when you can just start at 1
 * then if they go from postfix to prefix then you simply miss out on the number 1 and the first ticketId is 2 who cares...
 * 
 * ticketId because you're standing in line at the deli in the supermarket and you've grabbed from the machine a paper that has your number on it
 * and you're waiting for your number to be called so you can get the turkey
 * 
 * > "what is it called when you are in line at a deli and they have a machine that prints a paper with a number on it"
 * 
 * < It is called a take-a-number system or a queue management system. It uses a ticket dispenser to give out paper numbers so people can wait in order without standing in a tight line.
 * 
 * okay yeah it is a ticket dispenser we're good
 */
let WIDGET_ticketId_counter = 1;

let WIDGET_WidgetKind_pending = get_WidgetKind_None();
let WIDGET_WidgetKind_drawn = get_WidgetKind_None();
let WIDGET_restoreFocusToElement_drawn = null;

let WIDGET_ticketId_pending = 0;
let WIDGET_ticketId_drawn = 0;

let WIDGET_left = 0;
let WIDGET_top = 0;
/**
 * @type {MENU_Callback}
 */
let WIDGET_currentCallback = null;
let WIDGET_placeholder = null;
let WIDGET_value = null;
let WIDGET_target = null;

// Instead of passing the data around in a way that even still is prone to timing errors
// you should tag the UI with an id and each set increments this id you then verify that the id is matching upon
// submitting the "form"/"widget" and if the id doesn't match then the "widget" is stale and you ignore the submition.
//
// Although you'd want to ensure that every callback has the 'cancel' passed to it when it gets overwritten

let WIDGET_renderKindArray = [];
let WIDGET_isRenderPending = false;

let WIDGETrenderKind_Show_countOfPendingRequests = 0;

let WIDGET_shouldRestoreFocus = true;

let WIDGET_restoreFocusToElementOverride = null;

// You aren't focusing the widget element itself so blur likely won't work.
//WIDGET_element.addEventListener('focusout', () => WIDGET_hide());

function WIDGET_render_request(renderKind) {
    if (WIDGET_renderKindArray[WIDGET_renderKindArray.length - 1] !== renderKind) {
        WIDGET_renderKindArray.push(renderKind);
        if (renderKind === get_WIDGETrenderKind_Show()) WIDGETrenderKind_Show_countOfPendingRequests++;
    }
    
    if (!WIDGET_isRenderPending) {
        WIDGET_isRenderPending = true;
        requestAnimationFrame(WIDGET_render_do);
    }
}

function WIDGET_render_do() {
    let renderKind;
    
    while (renderKind = WIDGET_renderKindArray.shift()) {
        switch (renderKind) {
            case get_WIDGETrenderKind_Show():
                if (WIDGETrenderKind_Show_countOfPendingRequests-- > 1) break;
                WIDGET_render_do_Show();
                break;
            case get_WIDGETrenderKind_Hide():
                WIDGET_render_do_Hide();
                break;
        }
    }
    
    WIDGET_isRenderPending = false; // Reset the paint lock
}

function WIDGET_render_do_Show() {

    let WIDGET_element = document.getElementById('WIDGET');
    if (WIDGET_WidgetKind_drawn !== get_WidgetKind_None()) {
        WIDGET_element = null;
        // You don't have to invoke 'WIDGET_state_do_Hide' because there was a 1 to 1 overwrite of all the state due to the 'WIDGET_show' invocation which triggered this function.
        WIDGET_shouldRestoreFocus = false; // going to show a different widget so don't bother with focus here
        WIDGET_render_do_Hide();
    }

    if (!WIDGET_element) {
        WIDGET_element = document.createElement('div');
        WIDGET_element.id = 'WIDGET';
        document.body.appendChild(WIDGET_element);
    }

    WIDGET_WidgetKind_drawn = WIDGET_WidgetKind_pending;

    if (WIDGET_restoreFocusToElementOverride) {
        WIDGET_restoreFocusToElement_drawn = WIDGET_restoreFocusToElementOverride;
        WIDGET_restoreFocusToElementOverride = null;
    }
    else {
        WIDGET_restoreFocusToElement_drawn = document.activeElement;
    }
    
    WIDGET_ticketId_drawn = WIDGET_ticketId_pending;

    switch (WIDGET_WidgetKind_drawn) {
        case get_WidgetKind_InputText():
            WIDGET_CreateInputText();
            break;
        case get_WidgetKind_YesCancel():
            WIDGET_CreateYesCancel();
            break;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalLeft = WIDGET_left;
    let finalTop = WIDGET_top;
    //let rect = WIDGET_element.getBoundingClientRect();

    // Check right edge
    //if (rect.right > viewportWidth) {
    if (WIDGET_left + WIDGET_element.offsetWidth > viewportWidth) {
      finalLeft = viewportWidth - WIDGET_element.offsetWidth - 10; // 10px padding boundary
    }
    // Check left edge (fallback if menu is wider than screen)
    if (finalLeft < 0) finalLeft = 10;

    // Check bottom edge
    //if (rect.bottom > viewportHeight) {
    if (WIDGET_top + WIDGET_element.offsetHeight > viewportHeight) {
      finalTop = viewportHeight - WIDGET_element.offsetHeight - 10; 
    }
    // Check top edge
    if (finalTop < 0) finalTop = 10;

    // 3. Apply the corrected coordinates
    WIDGET_element.style.left = `${finalLeft}px`;
    WIDGET_element.style.top = `${finalTop}px`;
}

/**
 * Two consecutive invocations of this function will result in the first invocation's 'callback' being invoked with the cancelled state.
 * Whether the first invocation's rAF request triggered or not has no impact on things.
 * - If it was triggered the cancelled state is still passed to the first invocation's 'callback'.
 * - If it was NOT triggered, then the rAF request that relates to the first invocation in particular is skipped.
 * 
 * @param {number} widgetKind 'get_WidgetKind_%()'
 * @param {number} left 
 * @param {number} top 
 * @param {string} placeholder if the corresponding widget has a corresponding placeholder attribute this string will be provided as the attribute's value. This is stored in the variable 'WIDGET_placeholder'.
 * @param {string | object} value if the corresponding widget has a value attribute and this is expectedly a 'string' then this will be provided as the attribute's value. This is stored in the variable 'WIDGET_value'.
 * @param {object} target this is stored in the variable 'WIDGET_target'.
 * @param {MENU_Callback} callback this is invoked when the widget is either submitted or cancelled.
 */
async function WIDGET_show(widgetKind, left, top, placeholder, value, target, callback) {

    WIDGET_ticketId_pending = WIDGET_ticketId_counter++;
    WIDGET_WidgetKind_pending = widgetKind;

    // TODO: Does this go before the above ticketId logic? I'm not sure but I feel confident that it makes more sense at the least above the '_left and _top' logic.
    if (WIDGET_currentCallback) {
        await WIDGET_currentCallback({isCancelled:true, value:undefined});
    }
    WIDGET_currentCallback = callback;

    WIDGET_left = left;
    WIDGET_top = top;
    WIDGET_placeholder = placeholder;
    WIDGET_value = value;
    WIDGET_target = target;

    WIDGET_render_request(get_WIDGETrenderKind_Show());
}

function WIDGET_render_do_Hide() {
    const WIDGET_element = document.getElementById('WIDGET');

    switch (WIDGET_WidgetKind_drawn) {
        case get_WidgetKind_InputText():
            let input = document.getElementById('WIDGET_inputText');
            input.removeEventListener('keydown', WIDGET_inputTextOnKeyDown);
            break;
        case get_WidgetKind_YesCancel():
            let yesButtonElement = document.getElementById('WIDGET_YesCancel_yes');
            yesButtonElement.removeEventListener('onclick', WIDGET_YesCancelButtonOnClick_yes);
            let cancelButtonElement = document.getElementById('WIDGET_YesCancel_cancel');
            cancelButtonElement.removeEventListener('onclick', WIDGET_YesCancelButtonOnClick_cancel);
            break;
    }
    WIDGET_WidgetKind_drawn = get_WidgetKind_None();
    WIDGET_element.remove();
    if (WIDGET_shouldRestoreFocus && WIDGET_restoreFocusToElement_drawn)
        WIDGET_restoreFocusToElement_drawn.focus();
}

async function WIDGET_state_do_Hide(shouldRestoreFocus) {

    // TODO: This is believed to prevent any funny business where a UI is being shown, asked to be hidden, submitted before the hide rAF. Once this is confirmed to be true (or other...) remove or update this comment accordingly.
    WIDGET_ticketId_pending = WIDGET_ticketId_counter++;

    WIDGET_shouldRestoreFocus = shouldRestoreFocus;
    if (WIDGET_currentCallback) {
        await WIDGET_currentCallback({isCancelled:true, value:undefined});
    }
    WIDGET_currentCallback = null;
    WIDGET_WidgetKind_pending = get_WidgetKind_None();
    WIDGET_target = null;
}

async function WIDGET_hide(shouldRestoreFocus) {
    await WIDGET_state_do_Hide(shouldRestoreFocus);
    WIDGET_render_request(get_WIDGETrenderKind_Hide());
}

/**
 * resultObject is of the pattern {isCancelled:isCancelled, value:input.value}.
 * 
 * This function will perform any generalized widget validation.
 * At the moment the validation relates to whether the currently displayed UI is up to date with the show/hide function invocations.
 * 
 * This function is used for the UI event handlers.
 * Any internal "completion" due to for example invoking 'hide' when a UI" is being shown skips this function.
 * If anyone desires to in the future change this such that the internal "completion" uses this function, take care because 'WIDGET_ticketId_pending === WIDGET_ticketId_drawn'
 * isn't quite as sensible when dealing with internal "completion" that needs to cancel the previous UI.
 */
async function WIDGET_completeForm(resultObject) {
    if (WIDGET_currentCallback) {
        if (WIDGET_ticketId_pending !== WIDGET_ticketId_drawn) {
            resultObject.isCancelled = true;
        }
        // Avoid duplicate submissions
        // TODO: You should permit a means of cancelling the asynchronous request
        // TODO: You should consider handling the case where the asynchronous request fails due to a reason that would reasonably be followed up by allowing the user to try submitting the form again.
        //
        let local_WIDGET_currentCallback = WIDGET_currentCallback;
        WIDGET_currentCallback = null;
        return local_WIDGET_currentCallback(resultObject);
    }
}

async function WIDGET_inputTextOnKeyDown(event) {
    if (event.key === 'Enter' || event.key === 'Escape') {
        let isCancelled = event.key === 'Enter' ? false : true;
        let input = document.getElementById('WIDGET_inputText');
        await WIDGET_completeForm({isCancelled:isCancelled, value:input.value});
        await WIDGET_hide(true);
    }
}

async function WIDGET_YesCancelButtonOnClick_yes(event) {
    await WIDGET_completeForm({isCancelled: false, value:'Yes'});
    await WIDGET_hide(true);
}

async function WIDGET_YesCancelButtonOnClick_cancel(event) {
    await WIDGET_completeForm({isCancelled:true, value:'Cancel'});
    await WIDGET_hide(true);
}

function WIDGET_CreateInputText() {

    const WIDGET_element = document.getElementById('WIDGET');

    let input = document.createElement('input');
    input.type = "text";
    input.id = 'WIDGET_inputText';
    if (WIDGET_placeholder || WIDGET_placeholder === '') {
        input.placeholder = WIDGET_placeholder;
    }

    // TODO: "typeof value === 'string'" is not a bulletproof solution for checking whether the value is a string.
    // TODO: Extremely undocumented behavior in relation to the ways of using 'WIDGET_SHOW_value'.
    //
    if ((WIDGET_value || WIDGET_value === '') && (typeof WIDGET_value === 'string')) {
        input.value = WIDGET_value;
    }

    input.addEventListener('keydown', WIDGET_inputTextOnKeyDown);
    WIDGET_element.appendChild(input);
    input.focus();
}

function WIDGET_CreateYesCancel() {

    const WIDGET_element = document.getElementById('WIDGET');

    let topDivElement = document.createElement('div');
    if (WIDGET_placeholder || WIDGET_placeholder === '') {
        topDivElement.textContent = WIDGET_placeholder;
    }

    let bottomDivElement = document.createElement('div');
    let yesButtonElement = document.createElement('button');
    yesButtonElement.textContent = 'Yes';
    yesButtonElement.id = 'WIDGET_YesCancel_yes';
    yesButtonElement.addEventListener('click', WIDGET_YesCancelButtonOnClick_yes);
    bottomDivElement.appendChild(yesButtonElement);
    let cancelButtonElement = document.createElement('button');
    cancelButtonElement.textContent = 'Cancel';
    cancelButtonElement.id = 'WIDGET_YesCancel_cancel';
    cancelButtonElement.addEventListener('click', WIDGET_YesCancelButtonOnClick_cancel);
    bottomDivElement.appendChild(cancelButtonElement);

    WIDGET_element.appendChild(topDivElement);
    WIDGET_element.appendChild(bottomDivElement);
    yesButtonElement.focus();
}

/*
TODO:
- [ ] Check this for uncleared state when menu is finished
- [ ] Check this for uncleared state when widget is finished

Random quote from a video that I'm watching:
"the second reason I don't use AI and I would advise others not to is because I want to get better at what I do"

He's talking about youtube content creators using AI specifically.

Maybe things are different in that respect.

But when it comes to coding.

If you are 100% against AI I think you are stunting your growth immensely.

You VERY likely have consistent mistakes that you are making due to some assumption that you formed
(possibly formed YEARS ago).

And due to the fact that it "just works" you never questioned it, and are now
carrying around this "assumption" based baggage everytime you write code.

And the AI has many examples of how to do something.
It's gonna probably see what you're doing and something about it will jump out
as "you're doing that thing that every does wrong they have a name for it and all"

That's all that I use AI for I don't generate code.
I don't like AI autocomplete.

But it is like having a colleague that you can bounce ideas off of except your colleague is the entirety of all public knowledge (overly simplified description but...)

And I NEVER assume that the AI is correct about anything.

Most of my code I write myself, then if I'm dry for an idea I mess around giving AI some code snippets and see what it says.

More accurately I constantly have a hunch about something.
And I can typically get the AI to summarize the general consensus of my hunch.

It's like google searching back in the day, but at a much larger scale, and to a degree
a google search that interprets what you're saying and introduces innaccuracy in the process
BUT you know that AI is inaccurate.

When you learn coding for the first time they make a joke about making peanut butter and jelly
or giving directions somewhere and all the inferred cases that occur in natural language
and how you NEVER want the computer to infer.

AI is you telling the computer to infer, and introduce inaccuracy, and in the process allowing your 1 sentence
google search to be the equivalent of you having spent an hour searching the same "idea" just worded slightly differently.

I'm still getting don't speak recommended to me on all my youtube feeds it got me in my head fr

I spent an hour just today even the last hour of my coding was spent "talking" to an AI
and in the end I don't think I made any changes cause I wasn't able to be certain about the AI's correctness.

But I have all kinds of ideas now in my mind that I can explore


============

When you play a multiplayer game why do people consistently ask other players in a public chat
how a game mechanic works

just for people to respond with jokes about how "idk why don't you google it?"

It's cause we always wanted that inaccuracy.
It's just about controlling it.
And knowing when the inaccuracy exists vs when it doesn't.

Some might say "they're too lazy to alt tab to a browser and google it"
but I personally have desired asking a question in a game rather than googling it.
And for me it always is: google was way too strict with what I said, way too literal.
Sometimes you don't even fully know what you're asking.
But you can word it to another human and they'll go "I know what you are asking, this is the answer"

========

my main goal is to get down to 199 lbs because it is hard to lose weight but it is far easier to maintain it

And then given the time gated effect of learning
all I gotta do is do a non-zero amount of learning each day while enduring the caloric deficit


===========


I'm gonna start looking at the language server a lot more today.

I'm thinking two node kinds to start when parsing the javascript:
- PendingNode
- UnregisteredNode

PendingNode: You start here, you collect tokens into this which acts as a "buffer" of sorts.
             Once you've disambiguated the syntax you create the exact respective node kind in the AST


UnregisteredNode: For whatever reason you believe you've collected the final token of a syntax,
                  but you have not yet defined that syntax so you just are saying
                  "there's a complete node here I have no idea what it is though"

Then I hover at a certain line,column in the editor
and it asks the LSP what node it thinks exists there.

Then everyday I just get this to be a little bit more accurate than the previous day.

> I'm making a text editor with electron. I am supporting language server protocol.
> My editor is the client, and I'm also writing my own server to along with it. I have a lot of this written.
> But mostly I've been focused on the text editor, and the server has just been a simple lexer (more or less).
> 
> Today I want to start parsing and I have a plan for it, I wanted to run my plan by you.

< ...

> ...

< This is a creative and highly iterative approach to building a parser.
< By starting with broad, generic node types and refining them over time, you can get a working end-to-end LSP pipeline up and running immediately.
<
< However, you should tweak how you implement this "buffer" and "fallback" strategy so it aligns with how AST-based tooling actually works.
<
< Why Your Strategy is Great for LSP
< Your UnregisteredNode idea is a fantastic placeholder.
< In compiler design, this is similar to an Error Node or a generic Unknown Syntax Node.
< It ensures that even if your parser encounters a feature it doesn't understand yet (like a class keyword if you've only implemented function), the parser doesn't crash.
< It wraps the mysterious tokens in an UnregisteredNode and keeps moving. This perfectly preserves the rest of the document's structure for the LSP.
< 
< The Problem with PendingNode
< Using a PendingNode as an active "state" inside the finished AST can cause issues for your LSP hover requests.
< 1. Timing: A parser typically runs synchronously on a snapshot of the text. It processes tokens, finishes the tree, and then the LSP queries it.
< 2. Ambiguity: If a user hovers over code while the parser is still in a PendingNode state, the LSP won't be able to provide any useful information because the syntax hasn't been disambiguated yet.
<
< A Better Way: Lookahead and Fallbacks
< Instead of saving a PendingNode into your actual tree, use a standard Lookahead pattern during the parsing phase, and use your UnregisteredNode as the fallback asset.
< 
< Here is how to structure your parsing logic to achieve your daily iterative goal:
< ```js
< // Example of how your parser loop should look
< function parseStatement(tokenStream) {
<   const startToken = tokenStream.peek();
< 
<   // 1. Lookahead/Disambiguate BEFORE creating a node
<   if (tokenStream.match("keyword", "function")) {
<     return parseFunctionDeclaration(tokenStream);
<   }
<   
<   if (tokenStream.match("keyword", "const") || tokenStream.match("keyword", "let")) {
<     return parseVariableDeclaration(tokenStream);
<   }
< 
<   // 2. Your "UnregisteredNode" Fallback
<   // If it matches nothing you know yet, consume tokens until a delimiter (like a semicolon)
<   const unknownTokens = [];
<   while (!tokenStream.isEOF() && !tokenStream.match("punctuator", ";")) {
<     unknownTokens.push(tokenStream.next());
<   }
<   
<   return {
<     type: "UnregisteredNode",
<     tokens: unknownTokens,
<     start: startToken.position, // line, col
<     end: tokenStream.peek().position
<   };
< }
< ```
<
< Implementing the LSP Hover Feature
< ...

> How do you implement the tooltip event? It sounds extremely expensive to keep an onmousemove event registered to track when the mouse stops moving.

< ...
< In modern editors, you do not manually track mouse stops using global coordinates.
< Instead, you combine efficient CSS styling for hover detection with standard LSP client lifecycle events.
< ...
<
Step 1: The UI Layer (Electron Renderer)
< Instead of tracking pixels, your editor should wrap every single character, token, or line in a text span.
< You then rely on the browser's native, highly optimized mouseenter and mouseleave events on those DOM elements
< ...

*/
