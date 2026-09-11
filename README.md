# Web Engineering Coding Playground Template

This repository is designed as the foundation for coding playgrounds in the Web Engineering course. It offers a structured space for experimenting with and mastering various web development technologies and practices. 
The project is based on [this](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/Accessibility_troubleshooting) repository from MDN.

The project introduces a lot of code smells for you to tackle. 
**Let's get coding!**

## Submission Details and Deadlines
* Coding playgrounds are **individual** work
* Use this base template to create your project repository.
* Submit your repository link once.
* Each playground must be submitted via a new branch in that repository (last commit within deadline will be graded).
  * Naming conventions of branch: <code>playground-1</code>, <code>playground-2</code>, ...
* Each playground consists of 5 tasks, 1 point each. A task is complete only when both its implementation work and its theory question have been answered.

### Submission Deadlines
* [1st Playground](#1-js-playground): 14.09.2026
* [2nd Playground](#2-dependency--and-build-management-playground): 28.09.2026
* [3rd Playground](#3-migrate-to-a-frontend-framework): 04.10.2026
* other Playgrounds TBA by Thomas Berger

## Features

- Wonderful UI-design :heart_eyes:
- Loads bear data using [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) :bear:
  - Original Wikipedia Page can be found [here](https://en.wikipedia.org/wiki/List_of_ursids)
- Worst JS coding practices :cold_sweat:
- No Build and Dependency Management at all :fire:


# Coding Playground Description

## 1. JS Playground
The provided base project template contains bad coding and templating practices and bugs for you to fix. Take a look into the component files and get a grasp of the inner workings of the provided project. The app should provide the requirements described below. Some are implemented poorly or do not work at all. 

### App Requirements
* On page load the app requests the Wikipedia API to extract bear information from Wikipedia's [list of ursids](https://en.wikipedia.org/wiki/List_of_ursids). The page then renders the provided image, the common name, the scientific name and it's range.
  * the bears should be ordered in the same order and number (no duplicates) as in the corresponding Wiki page.
  * if there is no image available, the app should show a placeholder image.
* Users are able to toggle the comment section.
* Users are able to leave their name and a comment (both should not be empty).
* Users are able to search the web page contents using a search query, whereby only the html contents with tag <code>article</code> should be highlighted.

### Tasks
Fix the application code and support them with short code examples where useful.

#### Task 1: Introduce ES modules

Split the code into separate script files and use ES modules (`import`/`export`). Choose module boundaries that separate concerns and avoid circular dependencies.

**Theory question:** How does an ES module differ from a classic script with respect to scope, strict mode, loading, and bindings? Explain why the module boundaries you chose make the application easier to maintain.

**Answer:**
 
> An ES module has its own top-level scope, while classic scripts can share variables and functions through the global scope. This allows for fine-grained control over what can be shared with other scripts and HTML documents by making use of the ```import```and ```export``` keywords.
> 
> Strict mode is activated on ES modules by default, while it can be explicitly invoked on regular scripts by typing ```"use strict";``` before any other statements. This mode eliminates some JavaScript silent errors by changing them to throw errors and can sometimes make code written in it run faster than identical code that's not strict mode.
> 
> ES modules are deferred by default (executes after the HTML document has been parsed), while classic scripts interrupt the document parsing process and make the browser execute them immediately when discovered. Fortunately, classic scripts can be deferred, too by adding the ```defer```attribute to the ```<script src="...">``` invocation.
>
> ES modules provide explicit ```import```and ```export``` bindings to other scripts and HTML documents. Imports are live, read-only views of exported bindings. An importer can't reassign the imported name, but it observes any reassignment performed within the exporting module.
>
> I divided the given JavaScript code into five modules according to their responsibilities. ```main.js``` acts as the entry point and initialises the individual features of the application. ```search.js``` contains the search and highlighting functionality, while ```comments.js``` handles showing, hiding, and adding comments. ```bearService.js``` is concerned with retrieving and processing bear data from the Wikipedia API, and ```bearView.js``` is in charge of displaying that data in the DOM. These boundaries assign each module a single concern, which means that changes in one module don't automatically affect the other components of the application as they're more loosely coupled. The imports also make dependencies explicit instead of relying on shared global state. The dependency structure is kept one-directional, which avoids circular dependencies and makes the flow of the application easier to understand.
#### Task 2: Correct the application behavior

Fix the semantic and functional issues according to the app requirements. Use appropriate DOM queries and event handling, and ensure the bear list has the same order and number of entries as the source page.

**Theory question:** Describe event propagation (capturing, target, and bubbling). Where could event delegation be useful in this application, and what trade-off would it introduce?

**Answer:**
 
> In general, event propagation defines how an event travels through the DOM tree and the execution order of its event listeners. In the first phase called "capturing phase", events propagate from the outermost ```window``` element at the top down through the DOM tree to the target node (button, hyperlink, etc.) that was interacted with. All event listeners registered with the ```addEventListener()``` method and its third optional parameter ```useCapture``` explicitly set to ```true``` in this hierarchy will be triggered according to their position in it, with those using the default ```false``` option being skipped.
>
> In the following "target phase", the event arrives at the element that originally triggered it. This element can be accessed through the ```event.target``` property.
> 
> In the final "bubbling phase", events bubble back up the DOM tree in the reverse order. Event listeners registered with the default ```useCapture``` value of ```false``` are executed during this phase.
> 
> Event delegation is a pattern used to handle events efficiently by attaching a single event listener to a parent element instead of adding listeners to multiple similar child elements. A useful application of event delegation could be the dynamic posting of comments. Instead of registering an event listener for every posted comment, a single registered event listener at the ```commentWrapper``` element can handle events for an arbitrary number of subordinate comments, which helps keep the DOM tree relatively simple as more comments are posted. However, event delegation works only if event bubbling is enabled (= the parameter ```useCapture```of the ```addEventListener()``` method is set to ```false```). Moreover, the event handler becomes more complex because it has to check which child element triggered the event, potentially resulting in reduced performance.
#### Task 3: Make failures explicit

Add error handling with `try`/`catch` and show useful, user-facing error messages. Check whether each image can be loaded and render a placeholder when it cannot. Do not represent a failed request as valid empty data.

**Theory question:** How do synchronous exceptions and rejected promises travel through this application? Explain where errors should be caught and why catching every error at its source can make failures harder to diagnose.


**Answer:**
 
>In ordinary synchronous code, a thrown exception propagates immediately up the current call stack until a matching ```catch``` block handles it. In an ```async``` function, however, a thrown exception causes the Promise returned by that function to be rejected with the thrown value as its rejection reason. Such a rejected Promise is not handled simply by using ```await```. When a rejected Promise is awaited, the ```await``` expression throws the rejection reason. If the ```await``` is inside a fitting ```try/catch``` block, the error will be handled here. Otherwise, the enclosing ```async``` function also returns a rejected Promise, allowing the failure to propagate further to its caller.
> 
> In this application, this can be seen in ```extractBears()```. The asynchronous callbacks used to create the bear data can throw if required information is missing. Because those callbacks are ```async```, the corresponding bear Promise is rejected. ```Promise.all()``` then also returns a rejected Promise if any of those Promises rejects. When ```initBearData()``` awaits ```extractBears()```, that rejection is thrown at the ```await``` expression and is handled by the outer try/catch block. The application can then log the technical error and show a user-facing error message instead of treating the failure as valid empty data. Image failures are handled at a lower level because the application can recover from them meaningfully. ```getImageOrPlaceholder()``` catches an error while retrieving or loading an image, logs a warning, and returns the placeholder image. The remaining bear information is still valid, so there is no reason to fail the complete bear list. Errors that make the complete bear data unreliable, such as a failed Wikipedia request or invalid source data, should instead propagate to the superordinate ```initBearData()```, where the application has enough context to treat the whole operation as failed and inform the user.
> 
> Catching every error immediately at its source can make failures harder to diagnose if the error is suppressed or replaced with an apparently valid fallback value such as an empty array. Higher-level code may then be unable to distinguish between a successful operation that genuinely produced no meaningfull data and an operation that failed. Errors should therefore be caught where they can be reasonably recovered from, translated into an appropriate failure for the user, or enriched with additional context.

#### Task 4: Refactor asynchronous control flow

Replace promise callback chains with `async`/`await` and refactor suitable callbacks to arrow functions. Run independent asynchronous operations concurrently where doing so is safe.

**Theory question:** Explain the relationship between `async`/`await`, promises, the microtask queue, and the browser event loop. Also explain why an arrow function is not always an interchangeable replacement for a regular function, particularly regarding `this`.

**Answer:**
 
>```async/await``` is built on top of Promises. An ```async``` function always returns a Promise. When the code execution reaches ```await```, the function is suspended until the awaited value is settled, but the JavaScript thread and the browser aren't blocked. Once the awaited Promise fulfills or rejects, continuation of the ```async``` function is scheduled as a microtask. Promise reaction handlers such as ```.then()``` callbacks are also processed through the microtask queue.
>
> The browser event loop coordinates this execution. After the currently executing task and its synchronous JavaScript have finished, the browser processes queued microtasks before moving on to the next task. This is why Promise callbacks and continuations after ```await``` do not execute immediately in the middle of currently running synchronous code.
>
> In our application, ```async/await``` makes dependent asynchronous operations easier to read, for example fetching the Wikipedia response before processing its JSON. Independent operations, such as loading the images for the eight different bears, can run concurrently. The application creates a Promise for each bear and uses ```Promise.all()``` to wait for all of them. This avoids unnecessarily loading the images one after another while still preserving the order of the results.
>
> Arrow functions are not always interchangeable with regular functions because they do not define their own ```this```. Instead, they lexically inherit ```this``` from the surrounding scope. A regular function used as a DOM event listener can receive the element on which the listener is registered as ```this```. For example, the search handler in this application uses ```this.q.value``` to access the search field. Replacing that callback directly with an arrow function would change the meaning of this and could break the code. An arrow function could be used if the code instead accessed the element through ```event.currentTarget```. Therefore, arrow functions are suitable for callbacks that do not depend on their own dynamic ```this```, but they should not be used as automatic replacements for any and all regular functions.
#### Task 5: Remove remaining code smells

Find and eliminate the remaining bad coding practices. Consider scope, accidental globals, mutation and shared references, function responsibilities, naming, duplication, and DOM update patterns. Document each relevant finding, why it is problematic, and how you fixed it below.

**Theory question:** Select one of your refactorings and explain how JavaScript scope, closures, references, or prototypes caused the original risk. State how you verified that your refactoring preserved behavior.

**Answer:**
 
>One refactoring concerned the recursive DOM traversal in the search feature. The original implementation iterated directly over node.childNodes while the traversal could also modify the DOM by replacing matching text nodes with new text and ```<mark>``` nodes. This was risky because DOM nodes are reference objects and ```childNodes``` is a live NodeList. A live collection reflects changes to the DOM immediately. Therefore, replacing nodes while iterating over the same collection could change the collection during traversal and make the iteration harder to reason about.
>
>I changed the traversal to use ```Array.from(node.childNodes)``` before iterating. This creates a static array containing references to the child nodes that existed at that moment. The nodes themselves are still referenced objects, but the collection being iterated no longer changes when the DOM is modified during highlighting. Moreover, I verified that the refactoring preserved behavior by testing searches with normal words, different capitalization, regular-expression special characters, and multiple consecutive searches. I also checked that previous highlights were removed correctly, hidden comment content was skipped while hidden, visible comment text could still be searched, and interactive elements such as the comments toggle button were not highlighted. The resulting search behavior remained the same where intended, while the DOM traversal became more predictable.



> **What bad coding practices did you find? Why is it a bad practice and how did you fix it?**
> 
> ### Task 1
> 
> The ```<script>``` block at the end of index.html had to be replaced with a ```<script>``` call at the top of the file inside the ```<head>``` element. Scripts to be integrated should always be called at the beginning of the .html file because otherwise, it wouldn't be clear what scripts are to be referenced in the long run and chaos would ensue.
> 
> ### Task 5
>
> | Bad coding practice | Reason | How to fix it |
> |---|---|---|
> | Extensive use of `var` throughout the JavaScript files | `var` is function-scoped and does not clearly communicate whether reassignment is intended, which makes scope and mutation harder to reason about. | Replaced variables that are not reassigned with `const`. |
> | Service configuration was defined inside the data-loading function | Values such as the API URL, Wikipedia page and placeholder path are constant configuration and do not need to be recreated for every call. | Moved them to module scope as constants such as `BASE_URL`, `PAGE_TITLE` and `PLACEHOLDER_IMAGE`. |
> | `bearService.js` mixed data loading, error presentation and UI rendering | The service was coupled to `bearView.js` and had several responsibilities instead of only providing bear data. | Refactored it to export `loadBears()`, which returns data or propagates an error. `main.js` now coordinates loading, error handling and rendering. |
> | Rendering was included in the same `try/catch` as data loading | A DOM error could incorrectly be reported as a bear-data loading failure, making the actual cause harder to diagnose. | Restricted the `try/catch` in `main.js` to `loadBears()` and perform `renderBears()` only after successful loading. |
> | API URL construction and HTTP response handling were duplicated | The main Wikipedia request and image requests repeated URL construction, `fetch()`, `response.ok` checks and JSON parsing. | Extracted reusable helpers such as `buildApiUrl()` and `fetchJson()`. |
> | Bear parsing and asynchronous image loading were combined in one function | Parsing Wikipedia rows and enriching them with images are separate responsibilities and were unnecessarily coupled. | Extracted `parseBearRow()` for parsing and validation and kept image loading as a separate asynchronous step. |
> | Image loading depended on parser-specific regular-expression results and bear objects were mutated during enrichment | This coupled image handling to parsing internals and made shared object state harder to reason about. | Pass only the extracted filename to `getImageOrPlaceholder()` and create enriched bear objects with spread syntax such as `{ ...bear, image }`. |
> | Bear rendering relied on concatenated HTML strings, `innerHTML +=` and inline styles | This mixed application data, markup and presentation, repeatedly reparsed HTML and caused unnecessary DOM updates. | Create elements with DOM APIs and `textContent`, collect them in a `DocumentFragment`, update `.bear-list` with `replaceChildren()`, and move visual styling to CSS classes. |
> | Comment-related variable names and event-handler responsibilities were too broad | Names such as `form` and `list` were vague, while the submit handler performed validation, DOM construction, insertion and reset logic. | Introduced descriptive names such as `commentForm` and `commentList`, extracted `createCommentElement()`, build elements before inserting them, and reset the form with `commentForm.reset()`. |
> | Comment visibility was controlled through `style.display`, and a generic `div` was used as an interactive control | JavaScript was coupled to presentation values such as `block` and `none`, while the clickable element had no native button semantics. | Replaced the toggle with a `<button>`, use the `hidden` property for visibility, and synchronize `aria-expanded` with the current state. |
> | The search submit handler contained several unrelated responsibilities | It handled cleanup, regular-expression escaping, DOM traversal and highlighting in a single callback. | Extracted helpers such as `escapeRegExp()`, `clearHighlights()`, `walk()` and `highlightTextNode()`. |
> | Search highlighting used `innerHTML` and numeric DOM node-type values | Parsing page text as HTML was unnecessary, and magic numbers such as `1` and `3` made traversal logic less readable. | Create `<mark>` and text nodes explicitly and use `Node.ELEMENT_NODE` and `Node.TEXT_NODE`. |
> | Search traversal could modify interactive controls or hidden content | Elements inside `<article>`, such as the comments button and hidden comment section, could be traversed even when they should not be highlighted. | Skip configured elements such as `FORM` and `BUTTON`, skip hidden subtrees, and use a stable `Array.from(node.childNodes)` snapshot during recursive traversal. |
> | Search code depended on a regular function's dynamic `this` value | Accessing the search field through `this.q` depended on event-listener-specific behavior and prevented safe use of an arrow callback. | Use the explicit `event.currentTarget.elements.q` reference instead. |
> | Styling was spread across inline styles, JavaScript and `style.css`, with duplicate or overly specific selectors | Scattered styling and selectors such as `div[class="nav"]` made presentation harder to maintain and unnecessarily dependent on exact HTML structure. | Centralized styling in `style.css`, merged duplicate rules, replaced overly specific selectors with class selectors such as `.nav`, and fixed invalid CSS values. |
> | Deprecated or non-semantic HTML was used for headings, navigation, table headers, labels and structural regions | Elements such as `<font>`, generic `<div>` containers and `<td>` column headings described presentation rather than document meaning and reduced accessibility. | Replaced them with semantic elements such as headings, `<nav>`, `<header>`, `<aside>`, `<th scope="col">` and `<label>`. |
> | Repeated `<br><br>` elements were used for paragraph spacing | Line breaks were being used as a layout mechanism instead of representing actual line breaks. | Replaced paragraph-like text blocks with semantic `<p>` elements and leave visual spacing to CSS. |
> | Obsolete CSS and naming remained after the HTML refactoring | Old `<font>` selectors no longer matched anything, and names such as `.show-hide` and `.more_bears` were inconsistent with the final component structure. | Removed dead selectors and adopted consistent component-oriented names such as `.comments-toggle` and `.more-bears`. |

## 2. Dependency- and Build Management Playground
Build the application with ``npm`` and a build and a dependency management tool of your choice (e.g. [Vite](https://vitejs.dev/), [Webpack](https://webpack.js.org/), or others). 

### Tasks

#### Task 1: Establish the build

Set up the project with `npm` and a build tool of your choice (for example, Vite or Webpack). Keep source files separate from generated distribution files and commit the package-manager lockfile.

**Theory question:** Distinguish source, build, distribution, and deployment. What does your build tool do in development and in a production build, and why is the lockfile important for reproducibility?

#### Task 2: Migrate to TypeScript

Use TypeScript as the primary development language and adapt the source files and configuration accordingly. Enable strict checking, model the application's domain data, and validate data received from external APIs before treating it as a typed value.

**Theory question:** TypeScript uses structural typing and erases types during compilation. Explain both concepts and why a compile-time type alone cannot guarantee the shape of a Wikipedia API response at runtime.

#### Task 3: Add static analysis and formatting

Configure ESLint and Prettier using the rulesets below. Resolve all reported errors in the application code and avoid disabling rules without a written justification.

**Theory question:** What different problems do a linter, a formatter, and the TypeScript compiler detect? Give one concrete example for each from this project.

#### Task 4: Provide a consistent command interface

Define the following tasks within `npm scripts`:

  * `dev`: starts the development server.
  * `build`: runs the typescript compiler and bundles your application - bundling depends on your chosen build tool (e.g. Vite, Webpack) but typically bundles multiple files into one, applies optimizations like minification and obfuscation and outputs final results to a `dist` or `build` directory.
  * `lint`: runs ESLint on all  `.js` and `.ts` files in your projects `/src` directory.
  * `lint:fix`: runs and also fixes all issues found by ESLint.
  * `format`: formats all `.js` and `.ts` files in your projects `/src` directory.
  * `format:check`: checks if the files in the `/src` directory are formatted according to Prettier's rules.

The `build`, `lint`, and `format:check` commands must exit with a non-zero status when their checks fail.

**Theory question:** Why are stable, composable commands such as these useful as an interface for developers and CI? Explain idempotence and identify which of your scripts should be idempotent.

#### Task 5: Enforce quality before integration

Configure a pre-commit hook that checks staged code using [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged). Configure a continuous-integration workflow that installs dependencies from the lockfile and runs the non-mutating build, type, lint, and formatting checks for every push or pull request.

**Theory question:** Compare a local pre-commit hook with a CI quality gate. Why is CI still necessary when hooks are configured, and why should CI use non-mutating checks rather than automatically rewriting source files?


**ESLint Configurations**

Use ESLint configs [standard-with-typescript](https://www.npmjs.com/package/eslint-config-standard-with-typescript) and [TypeScript ESLint Plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin).
Your `.eslintrc` file should have the following extensions:
```.eslintrc.yml
...
extends:
  - standard-with-typescript
  - plugin:@typescript-eslint/recommended
  - plugin:prettier/recommended
  - prettier
...
```
 
**Prettier Configurations**

Apply the following ruleset for Prettier:
``` .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 80
}
```

## 3. Migrate to a Frontend Framework
In this playground you will migrate your application to React with TypeScript while retaining the build and quality pipeline from Playground 2.

### Tasks

#### Task 1: Establish the React application

Add React (or another framework of your choice) to the existing Vite and TypeScript project and migrate the page entry point to a React root. Preserve the build, linting, formatting, and CI setup from Playground 2, adapting scripts and configuration where necessary.

**Theory question:** Contrast imperative DOM updates with React's declarative model. What happens during React's render, reconciliation, and commit phases, and why should code outside React not modify DOM nodes owned by the React root? If you chose not to use React, answer the same questions in the context of your chosen framework.

#### Task 2: Design the component tree

Decompose the interface into components organised by feature. Use props where appropriate, keep rendering pure, and render bear collections with stable keys.

**Theory question:** Explain how component boundaries and typed props act as contracts. What makes a key stable, why does React need keys during reconciliation, and why is an array index unsuitable when list entries can change order?

#### Task 3: Model state and interaction

Implement the comment toggle, comment form, and search behavior with React events and state. Use controlled inputs, immutable updates, and derived values rather than duplicate state. Lift state only to the closest common owner that needs it.

**Theory question:** Distinguish props, stored state, and derived values. Explain why direct mutation can produce incorrect React behavior and when lifting state is preferable to introducing context.

#### Task 4: Load and represent remote data

Load and validate the bear data within the React application. Represent loading, success, empty, and error states explicitly; prevent stale requests from overwriting newer results; and retain the image fallback behavior from Playground 1.

**Theory question:** Why is fetching data a synchronization with an external system rather than part of pure rendering? Explain how cleanup or cancellation prevents race conditions when a component unmounts or a request becomes irrelevant.

#### Task 5: Add client-side routing and verify the migration

Add at least a list route and a bear-detail route using a stable bear identifier as a route parameter. Use query parameters for optional search/filter view state where appropriate. Verify that every requirement from Playground 1 still works and that all Playground 2 quality commands pass.

**Theory question:** Distinguish client-side rendering, a single-page application, and client-side routing. Compare route parameters with query parameters, and describe one benefit and one cost of the SPA architecture used here.

---

## In-Class Accessibility Workshop
You might have noticed that the base project has a number of accessibility issues - your task is to explore the existing site and fix them. Use the tools presented in our accessibility workshop to test the accessibility of your app and write a summary of your reports below.

### Tasks
* Accessibility Checks:
  * **Color**: Test the current color contrast (text/background), report the results of the test, and then fix them by changing the assigned colors.
  * **Semantic HTML**: Report on what happens when you try to navigate the page using a screen reader. Fix those navigation issues.
  * **Audio**: The ``<audio>`` player isn't accessible to hearing impaired people — can you add some kind of accessible alternative for these users?
  * **Forms**:
    * The ``<input>`` element in the search form at the top could do with a label, but we don't want to add a visible text label that would potentially spoil the design and isn't really needed by sighted users. Fix this issue by adding a label that is only accessible to screen readers.
    * The two ``<input>`` elements in the comment form have visible text labels, but they are not unambiguously associated with their labels — how do you achieve this? Note that you'll need to update some of the CSS rule as well.
  * **Comment Section**: The show/hide comment control button is not currently keyboard-accessible. Can you make it keyboard accessible, both in terms of focusing it using the tab key, and activating it using the return key?
  * **The table**: The data table is not currently very accessible — it is hard for screen reader users to associate data rows and columns together, and the table also has no kind of summary to make it clear what it shows. Can you add some features to your HTML to fix this problem?


>
> _Note your findings here..._
>

<p>© 2026 Leon Freudenthaler (Hochschule Campus Wien). All rights reversed.</p>
